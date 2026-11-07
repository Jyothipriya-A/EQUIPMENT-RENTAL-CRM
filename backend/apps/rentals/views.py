from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction, models
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from datetime import datetime, date, timedelta
from decimal import Decimal
import io

from .models import (
    Rental, RentalItem, RentalStatusHistory, DispatchRecord,
    ReturnRecord, DamageInspection, RentalExtension, SettlementRecord
)
from .serializers import (
    RentalSerializer, RentalItemSerializer, DispatchRecordSerializer,
    ReturnRecordSerializer, DamageInspectionSerializer,
    RentalExtensionSerializer, SettlementRecordSerializer
)
from apps.customers.models import Customer
from apps.inventory.models import Product, Asset, Category
from apps.billing.models import Payment, LedgerEntry, SecurityDeposit, Invoice
from apps.maintenance.models import MaintenanceRecord
from apps.notifications.models import Notification

class AvailabilityCheckView(APIView):
    """
    Real-time asset and product availability calculator.
    Calculates availability based on actual physical asset records and overlapping reservations/rentals.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        category_id = request.query_params.get('category_id')
        product_id = request.query_params.get('product_id')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not start_date_str or not end_date_str:
            return Response(
                {"detail": "Both start_date and end_date query parameters are required (YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            if end_date < start_date:
                return Response(
                    {"detail": "end_date cannot be earlier than start_date."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Base product queryset
        products = Product.objects.filter(status='active').select_related('category')
        if category_id:
            products = products.filter(category_id=category_id)
        if product_id:
            products = products.filter(id=product_id)

        # Find all assets currently booked in overlapping active rentals
        overlapping_rentals = Rental.objects.filter(
            rental_status__in=[
                'Reserved', 'Confirmed', 'Ready for Dispatch', 'Partially Dispatched',
                'Dispatched', 'Active', 'Partially Returned', 'Return Pending Inspection', 'Overdue'
            ],
            rental_start_date__lte=end_date,
            expected_return_date__gte=start_date
        )
        
        booked_asset_ids = set(
            RentalItem.objects.filter(
                rental__in=overlapping_rentals,
                item_status__in=['Reserved', 'Ready for Dispatch', 'Dispatched']
            ).values_list('asset_id', flat=True)
        )

        results = []
        for prod in products:
            all_assets = prod.assets.all().select_related('supplier')
            total_count = all_assets.count()
            
            # Eligible assets: not damaged, not in maintenance, not retired, not pending inspection, not overlapping
            available_assets_list = []
            for asset in all_assets:
                if asset.availability_status in ['Damaged', 'Under Maintenance', 'Maintenance', 'Retired', 'Return Pending Inspection']:
                    continue
                if asset.id in booked_asset_ids:
                    continue
                available_assets_list.append({
                    'id': asset.id,
                    'asset_id': asset.asset_id,
                    'serial_number': asset.serial_number,
                    'condition': asset.current_condition,
                    'location': asset.location,
                    'supplier': asset.supplier.name if asset.supplier else 'N/A'
                })

            duration_days = max(1, (end_date - start_date).days)
            if duration_days >= 30:
                est_rate = (prod.monthly_rental_rate / Decimal(30)) * Decimal(duration_days)
            elif duration_days >= 7:
                est_rate = (prod.weekly_rental_rate / Decimal(7)) * Decimal(duration_days)
            else:
                est_rate = prod.daily_rental_rate * Decimal(duration_days)

            results.append({
                'product_id': prod.id,
                'product_name': prod.name,
                'product_code': prod.product_code,
                'category_name': prod.category.name,
                'image_url': prod.image_url,
                'daily_rate': prod.daily_rental_rate,
                'weekly_rate': prod.weekly_rental_rate,
                'monthly_rate': prod.monthly_rental_rate,
                'security_deposit': prod.security_deposit,
                'replacement_value': prod.replacement_value,
                'late_fee_per_day': prod.late_fee_per_day,
                'estimated_rental_for_period': round(est_rate, 2),
                'total_quantity': total_count,
                'available_quantity': len(available_assets_list),
                'available_assets': available_assets_list
            })

        return Response(results)


class RentalViewSet(viewsets.ModelViewSet):
    queryset = Rental.objects.all().select_related('customer', 'staff_responsible').prefetch_related(
        'items__asset', 'items__product', 'dispatch_records', 'return_records',
        'damage_inspections', 'extensions', 'status_history'
    ).order_by('-created_at')
    serializer_class = RentalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        customer_id = self.request.query_params.get('customer', None)
        search = self.request.query_params.get('search', None)
        is_overdue = self.request.query_params.get('is_overdue', None)
        is_quotation = self.request.query_params.get('is_quotation', None)

        if status_param:
            queryset = queryset.filter(rental_status=status_param)
        if is_quotation == 'true':
            queryset = queryset.filter(is_quotation=True)
        elif is_quotation == 'false':
            queryset = queryset.filter(is_quotation=False)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if search:
            queryset = queryset.filter(
                models.Q(rental_id__icontains=search) |
                models.Q(customer__full_name__icontains=search) |
                models.Q(customer__company_name__icontains=search) |
                models.Q(customer__phone_number__icontains=search) |
                models.Q(po_number__icontains=search)
            )
        if is_overdue == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(
                rental_status__in=['Dispatched', 'Active', 'Partially Returned', 'Return Pending Inspection', 'Overdue'],
                expected_return_date__lt=today
            )
        return queryset

    @action(detail=False, methods=['post'], url_path='create_quotation')
    def create_quotation(self, request):
        """
        Create a quotation for a customer with pricing calculation.
        """
        data = request.data
        customer_id = data.get('customer_id')
        start_date_str = data.get('rental_start_date')
        end_date_str = data.get('expected_return_date')
        asset_ids = data.get('asset_ids', [])
        discount = Decimal(str(data.get('discount', 0)))
        delivery_charges = Decimal(str(data.get('delivery_charges', 0)))
        tax_rate = Decimal(str(data.get('tax_rate', 18)))
        po_number = data.get('po_number', '')
        valid_until_str = data.get('valid_until')
        notes = data.get('notes', '')

        if not customer_id or not start_date_str or not end_date_str:
            return Response({"detail": "Customer and rental dates are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            if end_date < start_date:
                return Response({"detail": "Return date cannot be earlier than start date."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"detail": "Invalid date format."}, status=status.HTTP_400_BAD_REQUEST)

        customer = get_object_or_404(Customer, id=customer_id)
        duration_days = max(1, (end_date - start_date).days)

        with transaction.atomic():
            assets = list(Asset.objects.filter(id__in=asset_ids).select_related('product'))
            
            total_rental_charges = Decimal('0.00')
            total_security_deposit = Decimal('0.00')
            item_plans = []
            for asset in assets:
                prod = asset.product
                if duration_days >= 30:
                    rate = (prod.monthly_rental_rate / Decimal(30)) * Decimal(duration_days)
                elif duration_days >= 7:
                    rate = (prod.weekly_rental_rate / Decimal(7)) * Decimal(duration_days)
                else:
                    rate = prod.daily_rental_rate * Decimal(duration_days)
                
                deposit = prod.security_deposit
                total_rental_charges += rate
                total_security_deposit += deposit
                item_plans.append({
                    'asset': asset,
                    'product': prod,
                    'rate': round(rate, 2),
                    'deposit': deposit
                })

            subtotal = max(Decimal('0.00'), total_rental_charges + delivery_charges - discount)
            tax_amount = round(subtotal * (tax_rate / Decimal('100.00')), 2)
            total_amount = subtotal + tax_amount

            count = Rental.objects.filter(is_quotation=True).count() + 1
            quotation_id_str = f"QT-{timezone.now().year}-{count:04d}"

            rental = Rental.objects.create(
                rental_id=quotation_id_str,
                customer=customer,
                rental_start_date=start_date,
                expected_return_date=end_date,
                rental_duration=duration_days,
                is_quotation=True,
                quotation_valid_until=valid_until_str or (timezone.now().date() + timedelta(days=15)),
                po_number=po_number,
                rental_charges=round(total_rental_charges, 2),
                security_deposit=round(total_security_deposit, 2),
                delivery_charges=delivery_charges,
                discount=discount,
                tax=tax_amount,
                total_amount=round(total_amount, 2),
                paid_amount=Decimal('0.00'),
                outstanding_balance=round(total_amount, 2),
                rental_status='Quotation Sent',
                staff_responsible=request.user,
                notes=notes
            )

            for plan in item_plans:
                RentalItem.objects.create(
                    rental=rental,
                    asset=plan['asset'],
                    product=plan['product'],
                    daily_rate_applied=plan['rate'],
                    deposit_applied=plan['deposit'],
                    item_status='Reserved',
                    condition_on_dispatch=plan['asset'].current_condition
                )

            RentalStatusHistory.objects.create(
                rental=rental,
                old_status='None',
                new_status='Quotation Sent',
                changed_by=request.user,
                notes=f"Quotation {quotation_id_str} created for {customer.display_name}."
            )

        return Response(RentalSerializer(rental).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='convert_quotation')
    def convert_quotation(self, request, pk=None):
        """
        Convert a quotation into a confirmed rental booking.
        """
        rental = self.get_object()
        if not rental.is_quotation and rental.rental_status != 'Quotation Sent':
            return Response({"detail": "This record is not an active quotation."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            asset_ids = list(rental.items.values_list('asset_id', flat=True))
            assets = list(Asset.objects.select_for_update().filter(id__in=asset_ids))
            
            overlapping_rentals = Rental.objects.filter(
                rental_status__in=[
                    'Reserved', 'Confirmed', 'Ready for Dispatch', 'Partially Dispatched',
                    'Dispatched', 'Active', 'Partially Returned', 'Return Pending Inspection'
                ],
                rental_start_date__lte=rental.expected_return_date,
                expected_return_date__gte=rental.rental_start_date
            ).exclude(id=rental.id)

            booked_asset_ids = set(
                RentalItem.objects.filter(
                    rental__in=overlapping_rentals,
                    item_status__in=['Reserved', 'Ready for Dispatch', 'Dispatched']
                ).values_list('asset_id', flat=True)
            )

            for asset in assets:
                if asset.availability_status in ['Damaged', 'Under Maintenance', 'Maintenance', 'Retired']:
                    return Response({"detail": f"Asset {asset.serial_number} is currently {asset.availability_status} and unavailable."}, status=status.HTTP_400_BAD_REQUEST)
                if asset.id in booked_asset_ids:
                    return Response({"detail": f"Asset {asset.serial_number} is reserved for another booking in this period."}, status=status.HTTP_400_BAD_REQUEST)

            count = Rental.objects.filter(is_quotation=False).count() + 1
            new_rental_id = f"RNT-{timezone.now().year}-{count:04d}"

            rental.rental_id = new_rental_id
            rental.is_quotation = False
            rental.converted_from_quotation_at = timezone.now()
            rental.rental_status = 'Confirmed'
            rental.save()

            for asset in assets:
                asset.availability_status = 'Reserved'
                asset.save(update_fields=['availability_status'])

            SecurityDeposit.objects.get_or_create(
                rental=rental,
                defaults={
                    'customer': rental.customer,
                    'total_collected': Decimal('0.00'),
                    'status': 'Held',
                    'notes': f"Deposit for confirmed booking {rental.rental_id}"
                }
            )

            inv_count = Invoice.objects.count() + 1
            Invoice.objects.get_or_create(
                rental=rental,
                defaults={
                    'invoice_number': f"INV-{timezone.now().year}-{inv_count:04d}",
                    'customer': rental.customer,
                    'gstin': rental.customer.gstin or '',
                    'po_number': rental.po_number or '',
                    'invoice_date': timezone.localdate(),
                    'due_date': rental.rental_start_date,
                    'subtotal': rental.rental_charges + rental.delivery_charges - rental.discount,
                    'tax_amount': rental.tax,
                    'grand_total': rental.total_amount,
                    'balance_due': rental.total_amount,
                    'status': 'Issued',
                    'notes': f"Invoice generated on conversion of quotation {rental.rental_id}"
                }
            )

            RentalStatusHistory.objects.create(
                rental=rental,
                old_status='Quotation Sent',
                new_status='Confirmed',
                changed_by=request.user,
                notes=f"Quotation approved and converted to confirmed booking {rental.rental_id}."
            )

        return Response(RentalSerializer(rental).data)

    @action(detail=False, methods=['post'])
    def create_booking(self, request):
        """
        Step-by-step booking endpoint with atomic concurrency lock and overlap validation.
        """
        data = request.data
        customer_id = data.get('customer_id')
        start_date_str = data.get('rental_start_date')
        end_date_str = data.get('expected_return_date')
        asset_ids = data.get('asset_ids', [])
        discount = Decimal(str(data.get('discount', 0)))
        delivery_charges = Decimal(str(data.get('delivery_charges', 0)))
        tax_rate = Decimal(str(data.get('tax_rate', 18)))
        advance_payment = Decimal(str(data.get('advance_payment', 0)))
        payment_method = data.get('payment_method', 'UPI')
        payment_reference = data.get('payment_reference', '')
        po_number = data.get('po_number', '')
        notes = data.get('notes', '')

        if not customer_id or not start_date_str or not end_date_str or not asset_ids:
            return Response(
                {"detail": "Customer, rental dates, and at least one asset are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            if end_date < start_date:
                return Response({"detail": "Return date cannot be earlier than start date."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        customer = get_object_or_404(Customer, id=customer_id)
        duration_days = max(1, (end_date - start_date).days)

        with transaction.atomic():
            assets = list(Asset.objects.select_for_update().filter(id__in=asset_ids).select_related('product'))
            if len(assets) != len(asset_ids):
                return Response({"detail": "One or more selected assets were not found."}, status=status.HTTP_400_BAD_REQUEST)

            overlapping_rentals = Rental.objects.filter(
                rental_status__in=[
                    'Reserved', 'Confirmed', 'Ready for Dispatch', 'Partially Dispatched',
                    'Dispatched', 'Active', 'Partially Returned', 'Return Pending Inspection', 'Overdue'
                ],
                rental_start_date__lte=end_date,
                expected_return_date__gte=start_date
            )
            booked_asset_ids = set(
                RentalItem.objects.filter(
                    rental__in=overlapping_rentals,
                    item_status__in=['Reserved', 'Ready for Dispatch', 'Dispatched'],
                    asset_id__in=asset_ids
                ).values_list('asset_id', flat=True)
            )

            for asset in assets:
                if asset.availability_status in ['Damaged', 'Under Maintenance', 'Maintenance', 'Retired', 'Return Pending Inspection']:
                    return Response(
                        {"detail": f"Asset {asset.serial_number} is currently {asset.availability_status} and cannot be booked."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if asset.id in booked_asset_ids:
                    return Response(
                        {"detail": f"Asset {asset.serial_number} is already booked for an overlapping period ({start_date_str} to {end_date_str})."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            count = Rental.objects.filter(is_quotation=False).count() + 1
            rental_id_str = f"RNT-{timezone.now().year}-{count:04d}"

            total_rental_charges = Decimal('0.00')
            total_security_deposit = Decimal('0.00')

            item_plans = []
            for asset in assets:
                prod = asset.product
                if duration_days >= 30:
                    rate = (prod.monthly_rental_rate / Decimal(30)) * Decimal(duration_days)
                elif duration_days >= 7:
                    rate = (prod.weekly_rental_rate / Decimal(7)) * Decimal(duration_days)
                else:
                    rate = prod.daily_rental_rate * Decimal(duration_days)
                
                deposit = prod.security_deposit
                total_rental_charges += rate
                total_security_deposit += deposit
                item_plans.append({
                    'asset': asset,
                    'product': prod,
                    'rate': round(rate, 2),
                    'deposit': deposit
                })

            subtotal = max(Decimal('0.00'), total_rental_charges + delivery_charges - discount)
            tax_amount = round(subtotal * (tax_rate / Decimal('100.00')), 2)
            total_amount = subtotal + tax_amount

            rental_status = 'Confirmed' if advance_payment > 0 else 'Reserved'

            rental = Rental.objects.create(
                rental_id=rental_id_str,
                customer=customer,
                rental_start_date=start_date,
                expected_return_date=end_date,
                rental_duration=duration_days,
                po_number=po_number,
                rental_charges=round(total_rental_charges, 2),
                security_deposit=round(total_security_deposit, 2),
                delivery_charges=delivery_charges,
                discount=discount,
                tax=tax_amount,
                total_amount=round(total_amount, 2),
                paid_amount=Decimal('0.00'),
                outstanding_balance=round(total_amount, 2),
                rental_status=rental_status,
                staff_responsible=request.user,
                notes=notes
            )

            for plan in item_plans:
                RentalItem.objects.create(
                    rental=rental,
                    asset=plan['asset'],
                    product=plan['product'],
                    daily_rate_applied=plan['rate'],
                    deposit_applied=plan['deposit'],
                    item_status='Reserved',
                    condition_on_dispatch=plan['asset'].current_condition
                )
                plan['asset'].availability_status = 'Reserved'
                plan['asset'].save(update_fields=['availability_status'])

            SecurityDeposit.objects.create(
                rental=rental,
                customer=customer,
                total_collected=Decimal('0.00'),
                total_deducted=Decimal('0.00'),
                total_refunded=Decimal('0.00'),
                status='Held',
                notes=f"Deposit for booking {rental.rental_id}"
            )

            # Generate Invoice
            inv_count = Invoice.objects.count() + 1
            Invoice.objects.create(
                invoice_number=f"INV-{timezone.now().year}-{inv_count:04d}",
                rental=rental,
                customer=customer,
                gstin=customer.gstin or '',
                po_number=po_number or customer.po_number or '',
                invoice_date=timezone.localdate(),
                due_date=rental.rental_start_date,
                subtotal=subtotal,
                tax_amount=tax_amount,
                grand_total=total_amount,
                paid_amount=advance_payment,
                balance_due=max(Decimal('0.00'), total_amount - advance_payment),
                status='Partially Paid' if (advance_payment > 0 and advance_payment < total_amount) else ('Paid' if advance_payment >= total_amount else 'Issued'),
                notes="Invoice generated on booking creation"
            )

            if advance_payment > 0:
                pay_count = Payment.objects.count() + 1
                pay_id_str = f"PAY-{timezone.now().year}-{pay_count:04d}"

                payment = Payment.objects.create(
                    payment_id=pay_id_str,
                    rental=rental,
                    customer=customer,
                    payment_amount=advance_payment,
                    payment_method=payment_method,
                    transaction_reference=payment_reference,
                    payment_type='Advance Payment',
                    payment_status='Completed',
                    recorded_by=request.user,
                    notes="Advance payment at booking"
                )

                ledger_count = LedgerEntry.objects.count() + 1
                LedgerEntry.objects.create(
                    entry_number=f"LED-{timezone.now().year}-{ledger_count:05d}",
                    entry_type='Credit',
                    category='Rental Revenue',
                    amount=advance_payment,
                    description=f"Advance payment for rental {rental.rental_id}",
                    payment=payment,
                    rental=rental,
                    customer=customer
                )

                rental.recalculate_totals()

            RentalStatusHistory.objects.create(
                rental=rental,
                old_status='None',
                new_status=rental_status,
                changed_by=request.user,
                notes=f"Booking created with {len(assets)} equipment asset(s)."
            )

            Notification.objects.create(
                title=f"New Rental Booking: {rental.rental_id}",
                message=f"Customer {customer.display_name} booked {len(assets)} items from {start_date} to {end_date}.",
                notification_type='new_booking',
                link=f"/admin/rentals/{rental.id}"
            )

        serializer = RentalSerializer(rental)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='dispatch')
    def perform_dispatch(self, request, pk=None):
        """
        Record equipment dispatch. Supports partial dispatch when asset_ids is provided.
        """
        rental = self.get_object()
        if rental.rental_status in ['Returned', 'Completed', 'Cancelled']:
            return Response(
                {"detail": f"Cannot dispatch rental in status {rental.rental_status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        accessories = request.data.get('accessories_provided', 'Standard toolkit & cables')
        signature_name = request.data.get('customer_signature_name', rental.customer.full_name)
        initial_notes = request.data.get('initial_condition_notes', 'All equipment tested and verified functional.')
        delivery_location = request.data.get('delivery_location', 'Counter Pick-up / Yard')
        selected_asset_ids = request.data.get('asset_ids', None)

        with transaction.atomic():
            # If asset_ids provided, partial dispatch those; else all items
            if selected_asset_ids:
                items_to_dispatch = rental.items.filter(asset_id__in=selected_asset_ids, item_status__in=['Reserved', 'Ready for Dispatch'])
            else:
                items_to_dispatch = rental.items.filter(item_status__in=['Reserved', 'Ready for Dispatch'])

            if not items_to_dispatch.exists():
                return Response({"detail": "No eligible items found to dispatch."}, status=status.HTTP_400_BAD_REQUEST)

            now_dt = timezone.now()
            for item in items_to_dispatch:
                item.item_status = 'Dispatched'
                item.dispatched_at = now_dt
                item.save(update_fields=['item_status', 'dispatched_at'])

                asset = item.asset
                asset.availability_status = 'Rented'
                asset.save(update_fields=['availability_status'])

            total_items_count = rental.items.count()
            dispatched_items_count = rental.items.filter(item_status='Dispatched').count()
            is_partial = dispatched_items_count < total_items_count

            DispatchRecord.objects.create(
                rental=rental,
                dispatched_by=request.user,
                dispatch_time=now_dt,
                delivery_location=delivery_location,
                accessories_provided=accessories,
                customer_signature_name=signature_name,
                initial_condition_notes=initial_notes,
                is_partial=is_partial
            )

            old_status = rental.rental_status
            new_status = 'Partially Dispatched' if is_partial else 'Dispatched'
            rental.rental_status = new_status
            rental.save(update_fields=['rental_status', 'updated_at'])

            RentalStatusHistory.objects.create(
                rental=rental,
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                notes=f"Dispatched {items_to_dispatch.count()} items by {request.user.get_full_name() or request.user.username} to {signature_name} at {delivery_location}."
            )

            Notification.objects.create(
                title=f"Equipment Dispatched: {rental.rental_id}",
                message=f"{items_to_dispatch.count()} item(s) handed over to {rental.customer.display_name}.",
                notification_type='general',
                link=f"/admin/rentals/{rental.id}"
            )

        return Response(RentalSerializer(rental).data)

    @action(detail=True, methods=['post'], url_path='process_return')
    def process_return(self, request, pk=None):
        """
        Record return of equipment.
        CRITICAL BUSINESS RULE: Returned assets are set to 'Return Pending Inspection' and NOT immediately Available!
        """
        rental = self.get_object()
        if rental.rental_status not in ['Dispatched', 'Active', 'Partially Dispatched', 'Partially Returned', 'Overdue']:
            return Response(
                {"detail": f"Rental {rental.rental_id} cannot be returned from status '{rental.rental_status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data
        actual_return_date_str = data.get('actual_return_date')
        returned_asset_ids = data.get('asset_ids', [])
        notes = data.get('notes', '')

        if actual_return_date_str:
            try:
                actual_return_date = datetime.strptime(actual_return_date_str, '%Y-%m-%d').date()
            except ValueError:
                actual_return_date = timezone.now().date()
        else:
            actual_return_date = timezone.now().date()

        with transaction.atomic():
            if returned_asset_ids:
                items_to_return = rental.items.filter(asset_id__in=returned_asset_ids, item_status='Dispatched')
            else:
                items_to_return = rental.items.filter(item_status='Dispatched')

            if not items_to_return.exists():
                return Response({"detail": "No dispatched items eligible for return."}, status=status.HTTP_400_BAD_REQUEST)

            now_dt = timezone.now()
            for item in items_to_return:
                item.item_status = 'Return Pending Inspection'
                item.returned_at = now_dt
                item.save(update_fields=['item_status', 'returned_at'])

                # Set physical asset status to 'Return Pending Inspection'
                asset = item.asset
                asset.availability_status = 'Return Pending Inspection'
                asset.save(update_fields=['availability_status'])

            total_items = rental.items.count()
            pending_or_returned = rental.items.filter(item_status__in=['Return Pending Inspection', 'Returned', 'Damaged']).count()
            is_partial = pending_or_returned < total_items

            return_record = ReturnRecord.objects.create(
                rental=rental,
                return_time=now_dt,
                received_by=request.user,
                is_partial=is_partial,
                notes=notes
            )

            old_status = rental.rental_status
            new_status = 'Partially Returned' if is_partial else 'Return Pending Inspection'
            rental.rental_status = new_status
            rental.actual_return_date = actual_return_date
            rental.save(update_fields=['rental_status', 'actual_return_date', 'updated_at'])

            RentalStatusHistory.objects.create(
                rental=rental,
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user,
                notes=f"{items_to_return.count()} item(s) checked in. Status set to Return Pending Inspection."
            )

        return Response(RentalSerializer(rental).data)

    @action(detail=True, methods=['post'], url_path='inspect')
    def inspect_equipment(self, request, pk=None):
        """
        Damage & condition inspection for items in 'Return Pending Inspection'.
        Updates physical asset status to Available, Maintenance, or Damaged based on findings.
        Calculates automatic late fees and damage deductions.
        """
        rental = self.get_object()
        inspections_data = request.data.get('inspections', [])
        actual_return_date = rental.actual_return_date or timezone.now().date()

        if not inspections_data:
            return Response({"detail": "Inspection data for returned assets is required."}, status=status.HTTP_400_BAD_REQUEST)

        late_days = 0
        if actual_return_date > rental.expected_return_date:
            late_days = (actual_return_date - rental.expected_return_date).days

        with transaction.atomic():
            return_record = rental.return_records.first()
            total_late_fee = Decimal('0.00')
            total_damage_charges = Decimal('0.00')

            for insp in inspections_data:
                asset_id = insp.get('asset_id')
                rental_item = rental.items.filter(asset_id=asset_id).first()
                if not rental_item:
                    continue

                result = insp.get('inspection_result', 'Good Condition')
                damage_desc = insp.get('damage_description', '')
                damage_charge = Decimal(str(insp.get('damage_charges', 0)))
                replacement_cost = Decimal(str(insp.get('replacement_cost', 0)))
                missing_charge = Decimal(str(insp.get('missing_accessories_charge', 0)))
                missing_acc = insp.get('missing_accessories', '')

                item_late_fee = rental_item.product.late_fee_per_day * Decimal(late_days)
                total_late_fee += item_late_fee
                total_damage_charges += damage_charge + missing_charge

                rental_item.item_status = 'Returned' if result == 'Good Condition' else 'Damaged'
                rental_item.condition_on_return = result
                rental_item.save(update_fields=['item_status', 'condition_on_return'])

                asset = rental_item.asset
                if result == 'Good Condition':
                    asset.availability_status = 'Available'
                    asset.current_condition = 'Good'
                elif result in ['Minor Damage', 'Major Damage', 'Not Working']:
                    asset.availability_status = 'Under Maintenance'
                    asset.current_condition = 'Needs Repair'
                    # Auto-schedule maintenance record
                    m_count = MaintenanceRecord.objects.count() + 1
                    MaintenanceRecord.objects.create(
                        maintenance_id=f"MNT-{timezone.now().year}-{m_count:04d}",
                        asset=asset,
                        maintenance_type='Repair',
                        issue_description=f"Auto-flagged from return inspection of {rental.rental_id}: {damage_desc or result}",
                        service_provider="Internal Workshop",
                        start_date=timezone.localdate(),
                        expected_completion_date=timezone.localdate() + timedelta(days=3),
                        maintenance_cost=damage_charge,
                        assigned_staff=request.user,
                        status='Reported'
                    )
                else: # Missing Parts or Beyond Repair
                    asset.availability_status = 'Damaged'
                    asset.current_condition = 'Damaged'
                asset.save(update_fields=['availability_status', 'current_condition'])

                DamageInspection.objects.create(
                    rental=rental,
                    return_record=return_record,
                    asset=asset,
                    condition_before=rental_item.condition_on_dispatch or 'Good',
                    condition_after=result,
                    inspection_result=result,
                    damage_description=damage_desc,
                    damage_photograph_url=insp.get('damage_photograph_url', ''),
                    missing_accessories=missing_acc,
                    damage_charges=damage_charge,
                    replacement_cost=replacement_cost,
                    missing_accessories_charge=missing_charge,
                    late_days=late_days,
                    late_fee_charged=item_late_fee,
                    inspected_by=request.user
                )

            # Check if all items in rental are fully inspected
            uninspected_count = rental.items.filter(item_status='Return Pending Inspection').count()
            if uninspected_count == 0:
                rental.rental_status = 'Returned'
                rental.save(update_fields=['rental_status', 'updated_at'])

        return Response({
            'rental': RentalSerializer(rental).data,
            'late_days': late_days,
            'total_late_fee': total_late_fee,
            'total_damage_charges': total_damage_charges
        })

    @action(detail=True, methods=['post'], url_path='settle')
    def settle_booking(self, request, pk=None):
        """
        Final Settlement & Refund.
        Computes final gross charges, deducts late fees/damages from deposit,
        processes refund or collects remaining balance, and marks booking 'Completed'.
        """
        rental = self.get_object()
        data = request.data
        refund_method = data.get('payment_method', 'UPI')
        notes = data.get('notes', '')

        with transaction.atomic():
            # Calculate all financial components
            orig_rent = rental.rental_charges
            ext_charges = sum((e.additional_rental_charges for e in rental.extensions.all()), Decimal('0.00'))
            deliv_charges = rental.delivery_charges
            
            inspections = rental.damage_inspections.all()
            late_fees = sum((i.late_fee_charged for i in inspections), Decimal('0.00'))
            damages = sum((i.damage_charges for i in inspections), Decimal('0.00'))
            missing_charges = sum((i.missing_accessories_charge for i in inspections), Decimal('0.00'))
            taxes = rental.tax

            gross_total = orig_rent + ext_charges + deliv_charges + late_fees + damages + missing_charges + taxes
            total_paid = rental.paid_amount
            deposit_held = rental.security_deposit

            total_extra_deductions = late_fees + damages + missing_charges
            deposit_deductions = min(deposit_held, total_extra_deductions)
            refundable_deposit = max(Decimal('0.00'), deposit_held - deposit_deductions)
            net_balance_due = max(Decimal('0.00'), (gross_total - deposit_deductions) - total_paid)

            now_dt = timezone.now()
            s_count = SettlementRecord.objects.count() + 1
            settlement_id = f"SETTLE-{now_dt.year}-{s_count:04d}"

            settlement = SettlementRecord.objects.create(
                rental=rental,
                settlement_id=settlement_id,
                original_rental_amount=orig_rent,
                extension_charges=ext_charges,
                delivery_charges=deliv_charges,
                late_fees_total=late_fees,
                damage_charges_total=damages,
                missing_accessories_total=missing_charges,
                tax_total=taxes,
                gross_total=gross_total,
                amount_paid=total_paid,
                security_deposit_held=deposit_held,
                deposit_deductions=deposit_deductions,
                deposit_refunded=refundable_deposit,
                outstanding_balance_collected=net_balance_due,
                settled_by=request.user,
                settled_at=now_dt,
                notes=notes
            )

            # Record Deposit Refund payment if applicable
            if refundable_deposit > Decimal('0.00'):
                p_count = Payment.objects.count() + 1
                pay = Payment.objects.create(
                    payment_id=f"PAY-{now_dt.year}-{p_count:04d}",
                    rental=rental,
                    customer=rental.customer,
                    payment_amount=refundable_deposit,
                    payment_method=refund_method,
                    payment_type='Deposit Refund',
                    payment_status='Completed',
                    recorded_by=request.user,
                    notes=f"Security deposit refund at final settlement {settlement_id}"
                )
                l_count = LedgerEntry.objects.count() + 1
                LedgerEntry.objects.create(
                    entry_number=f"LED-{now_dt.year}-{l_count:05d}",
                    entry_type='Debit',
                    category='Deposit Refund',
                    amount=refundable_deposit,
                    description=f"Security deposit refund for {rental.rental_id}",
                    payment=pay,
                    rental=rental,
                    customer=rental.customer
                )

            # Record Final Settlement payment if customer paid remaining balance
            if net_balance_due > Decimal('0.00'):
                p_count = Payment.objects.count() + 1
                pay = Payment.objects.create(
                    payment_id=f"PAY-{now_dt.year}-{p_count:04d}",
                    rental=rental,
                    customer=rental.customer,
                    payment_amount=net_balance_due,
                    payment_method=refund_method,
                    payment_type='Final Settlement',
                    payment_status='Completed',
                    recorded_by=request.user,
                    notes=f"Final settlement balance payment for {rental.rental_id}"
                )
                l_count = LedgerEntry.objects.count() + 1
                LedgerEntry.objects.create(
                    entry_number=f"LED-{now_dt.year}-{l_count:05d}",
                    entry_type='Credit',
                    category='Rental Revenue',
                    amount=net_balance_due,
                    description=f"Final balance collected for {rental.rental_id}",
                    payment=pay,
                    rental=rental,
                    customer=rental.customer
                )

            # Update SecurityDeposit record status
            dep_rec = getattr(rental, 'deposit_record', None)
            if dep_rec:
                dep_rec.total_deducted = deposit_deductions
                dep_rec.total_refunded = refundable_deposit
                dep_rec.status = 'Fully Refunded'
                dep_rec.save()

            # Mark booking Completed
            old_status = rental.rental_status
            rental.rental_status = 'Completed'
            rental.outstanding_balance = Decimal('0.00')
            rental.paid_amount += net_balance_due
            rental.save(update_fields=['rental_status', 'outstanding_balance', 'paid_amount', 'updated_at'])

            RentalStatusHistory.objects.create(
                rental=rental,
                old_status=old_status,
                new_status='Completed',
                changed_by=request.user,
                notes=f"Final settlement completed. Gross total: ₹{gross_total}, Deposit refunded: ₹{refundable_deposit}."
            )

        return Response({
            'settlement': SettlementRecordSerializer(settlement).data,
            'rental': RentalSerializer(rental).data
        })

    @action(detail=True, methods=['post'], url_path='extend')
    def extend_rental(self, request, pk=None):
        """
        Extend rental duration with overlap re-validation and charge calculation.
        """
        rental = self.get_object()
        new_return_date_str = request.data.get('new_return_date')
        notes = request.data.get('notes', '')

        if not new_return_date_str:
            return Response({"detail": "new_return_date is required (YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_return_date = datetime.strptime(new_return_date_str, '%Y-%m-%d').date()
            if new_return_date <= rental.expected_return_date:
                return Response({"detail": "New return date must be after current return date."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"detail": "Invalid date format."}, status=status.HTTP_400_BAD_REQUEST)

        asset_ids = list(rental.items.values_list('asset_id', flat=True))

        with transaction.atomic():
            overlapping = Rental.objects.filter(
                rental_status__in=['Reserved', 'Confirmed', 'Dispatched', 'Active'],
                rental_start_date__lte=new_return_date,
                expected_return_date__gte=rental.expected_return_date
            ).exclude(id=rental.id)

            conflict = RentalItem.objects.filter(
                rental__in=overlapping,
                asset_id__in=asset_ids
            ).first()

            if conflict:
                return Response(
                    {"detail": f"Asset {conflict.asset.serial_number} is reserved for another booking during the requested extension period."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            extra_days = (new_return_date - rental.expected_return_date).days
            extra_charges = sum((item.product.daily_rental_rate * Decimal(extra_days) for item in rental.items.all()), Decimal('0.00'))
            extra_tax = round(extra_charges * Decimal('0.18'), 2)

            RentalExtension.objects.create(
                rental=rental,
                previous_expected_return_date=rental.expected_return_date,
                new_expected_return_date=new_return_date,
                additional_days=extra_days,
                additional_rental_charges=extra_charges,
                additional_tax=extra_tax,
                notes=notes,
                approved_by=request.user
            )

            old_date = rental.expected_return_date
            rental.expected_return_date = new_return_date
            rental.rental_duration += extra_days
            rental.rental_charges += extra_charges
            rental.tax += extra_tax
            rental.total_amount += (extra_charges + extra_tax)
            rental.outstanding_balance += (extra_charges + extra_tax)
            rental.save()

            RentalStatusHistory.objects.create(
                rental=rental,
                old_status=rental.rental_status,
                new_status=rental.rental_status,
                changed_by=request.user,
                notes=f"Rental extended from {old_date} to {new_return_date} (+{extra_days} days). Charges: ₹{extra_charges} + ₹{extra_tax} tax."
            )

        return Response(RentalSerializer(rental).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_rental(self, request, pk=None):
        """
        Cancel a rental reservation or quotation and release assets.
        """
        rental = self.get_object()
        if rental.rental_status in ['Dispatched', 'Active', 'Returned', 'Completed', 'Cancelled']:
            return Response(
                {"detail": f"Cannot cancel rental in status '{rental.rental_status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            old_status = rental.rental_status
            rental.rental_status = 'Cancelled'
            rental.save(update_fields=['rental_status', 'updated_at'])

            for item in rental.items.all():
                asset = item.asset
                if asset.availability_status == 'Reserved':
                    asset.availability_status = 'Available'
                    asset.save(update_fields=['availability_status'])

            RentalStatusHistory.objects.create(
                rental=rental,
                old_status=old_status,
                new_status='Cancelled',
                changed_by=request.user,
                notes=request.data.get('reason', 'Cancelled by staff / customer request.')
            )

        return Response(RentalSerializer(rental).data)

    @action(detail=True, methods=['get'])
    def agreement(self, request, pk=None):
        """
        Structured agreement payload.
        """
        rental = self.get_object()
        items = [{
            'product_name': item.product.name,
            'product_code': item.product.product_code,
            'serial_number': item.asset.serial_number,
            'condition': item.condition_on_dispatch or item.asset.current_condition,
            'daily_rate': float(item.daily_rate_applied),
            'security_deposit': float(item.deposit_applied),
        } for item in rental.items.all()]

        data = {
            'company': {
                'name': 'EQUIPRENT PRO - Equipment & Tool Rentals',
                'address': 'Industrial Area, Phase 2, Bengaluru, India',
                'phone': '+91 98765 43210',
                'email': 'support@rentalcrm.com',
                'gstin': '29ABCDE1234F1Z5',
            },
            'rental_id': rental.rental_id,
            'status': rental.rental_status,
            'booking_date': rental.booking_date,
            'rental_start_date': rental.rental_start_date,
            'expected_return_date': rental.expected_return_date,
            'rental_duration': rental.rental_duration,
            'po_number': rental.po_number,
            'customer': {
                'name': rental.customer.full_name,
                'company_name': rental.customer.company_name,
                'customer_type': rental.customer.customer_type,
                'phone': rental.customer.phone_number,
                'email': rental.customer.email or rental.customer.company_email,
                'address': rental.customer.address or rental.customer.billing_address,
                'gstin': rental.customer.gstin,
                'id_type': rental.customer.id_proof_type,
                'id_number': rental.customer.id_proof_number,
            },
            'items': items,
            'financials': {
                'rental_charges': float(rental.rental_charges),
                'security_deposit': float(rental.security_deposit),
                'delivery_charges': float(rental.delivery_charges),
                'discount': float(rental.discount),
                'tax': float(rental.tax),
                'total_amount': float(rental.total_amount),
                'paid_amount': float(rental.paid_amount),
                'outstanding_balance': float(rental.outstanding_balance),
            },
            'terms': [
                'Equipment must be returned on or before the expected return date.',
                'Late fee will be charged per day for delays beyond the return date.',
                'Security deposit will be refunded after complete damage and function inspection.',
                'Renter is fully liable for any physical damage, loss, or theft during rental tenure.',
                'Safe usage according to manufacturer guidelines is the sole responsibility of the renter.'
            ]
        }
        return Response(data)

    @action(detail=True, methods=['get'])
    def agreement_pdf(self, request, pk=None):
        """
        Generate and download clean PDF rental agreement using ReportLab.
        """
        rental = self.get_object()
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#1e293b'),
            alignment=1
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#64748b'),
            alignment=1
        )
        heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=8,
            spaceAfter=4
        )

        elements.append(Paragraph("<b>EQUIPRENT PRO - EQUIPMENT & TOOL RENTAL AGREEMENT</b>", title_style))
        elements.append(Paragraph("Industrial Area Phase 2, Bengaluru | GSTIN: 29ABCDE1234F1Z5 | Phone: +91 98765 43210", subtitle_style))
        elements.append(Spacer(1, 12))

        meta_data = [
            [f"Rental ID: {rental.rental_id}", f"Status: {rental.rental_status}"],
            [f"Customer: {rental.customer.display_name}", f"Phone: {rental.customer.phone_number}"],
            [f"GSTIN: {rental.customer.gstin or 'N/A'}", f"PO Number: {rental.po_number or 'N/A'}"],
            [f"Start Date: {rental.rental_start_date}", f"Expected Return: {rental.expected_return_date}"],
            [f"Duration: {rental.rental_duration} day(s)", f"Managed By: {rental.staff_responsible.get_full_name() if rental.staff_responsible else 'Counter Staff'}"]
        ]
        meta_table = Table(meta_data, colWidths=[270, 270])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 10))

        # Items Table
        elements.append(Paragraph("<b>EQUIPMENT ASSETS ASSIGNED</b>", heading_style))
        items_header = [["Item Description", "Serial No", "Condition", "Daily Rate (₹)", "Deposit (₹)"]]
        for item in rental.items.all():
            items_header.append([
                item.product.name,
                item.asset.serial_number,
                item.condition_on_dispatch or 'Good',
                f"₹{item.daily_rate_applied}",
                f"₹{item.deposit_applied}"
            ])
        
        items_table = Table(items_header, colWidths=[180, 110, 80, 85, 85])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f1f5f9')]),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 10))

        # Financial Breakdown
        elements.append(Paragraph("<b>FINANCIAL BREAKDOWN (₹ INR)</b>", heading_style))
        fin_data = [
            ["Rental Charges:", f"₹{rental.rental_charges}", "Security Deposit (Held):", f"₹{rental.security_deposit}"],
            ["Delivery Charges:", f"₹{rental.delivery_charges}", "Total Amount Payable:", f"₹{rental.total_amount}"],
            ["Discount Applied:", f"- ₹{rental.discount}", "Amount Paid:", f"₹{rental.paid_amount}"],
            ["GST / Taxes (18%):", f"₹{rental.tax}", "Outstanding Balance:", f"₹{rental.outstanding_balance}"]
        ]
        fin_table = Table(fin_data, colWidths=[140, 130, 140, 130])
        fin_table.setStyle(TableStyle([
            ('ALIGN', (1,0), (1,-1), 'RIGHT'),
            ('ALIGN', (3,0), (3,-1), 'RIGHT'),
            ('FONTNAME', (2,3), (3,3), 'Helvetica-Bold'),
            ('TEXTCOLOR', (2,3), (3,3), colors.HexColor('#dc2626')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(fin_table)
        elements.append(Spacer(1, 20))

        # Signatures
        sig_data = [
            ["Authorized Signatory (EquipRent Pro)", "Customer Acceptance & Sign-off"],
            ["\n\n_____________________________", "\n\n_____________________________"],
            [f"Date: {timezone.now().strftime('%Y-%m-%d')}", f"Name: {rental.customer.display_name}"]
        ]
        sig_table = Table(sig_data, colWidths=[270, 270])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 8.5),
        ]))
        elements.append(sig_table)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="Agreement_{rental.rental_id}.pdf"'
        return response
