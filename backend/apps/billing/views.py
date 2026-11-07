from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.utils import timezone
from decimal import Decimal
from datetime import datetime

from .models import Payment, LedgerEntry, SecurityDeposit, Invoice
from .serializers import PaymentSerializer, LedgerEntrySerializer, SecurityDepositSerializer, InvoiceSerializer
from apps.rentals.models import Rental
from apps.customers.models import Customer
from apps.notifications.models import Notification

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().select_related('customer', 'rental', 'recorded_by').order_by('-payment_date')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        rental_id = self.request.query_params.get('rental', None)
        customer_id = self.request.query_params.get('customer', None)
        payment_type = self.request.query_params.get('type', None)
        payment_method = self.request.query_params.get('method', None)
        search = self.request.query_params.get('search', None)

        if rental_id:
            queryset = queryset.filter(rental_id=rental_id)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if payment_type:
            queryset = queryset.filter(payment_type=payment_type)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        if search:
            queryset = queryset.filter(
                models.Q(payment_id__icontains=search) |
                models.Q(transaction_reference__icontains=search) |
                models.Q(customer__full_name__icontains=search) |
                models.Q(rental__rental_id__icontains=search)
            )
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Record payment, support partial payment, automatically update rental balances and ledger.
        """
        data = request.data
        rental_id = data.get('rental')
        customer_id = data.get('customer')
        amount = Decimal(str(data.get('payment_amount', 0)))
        payment_method = data.get('payment_method', 'UPI')
        payment_type = data.get('payment_type', 'Rental Payment')
        reference = data.get('transaction_reference', '')
        notes = data.get('notes', '')

        if amount <= Decimal('0.00'):
            return Response({"detail": "Payment amount must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        rental = None
        if rental_id:
            rental = Rental.objects.filter(id=rental_id).first()
            if not rental:
                rental = Rental.objects.filter(rental_id=rental_id).first()
            if rental and not customer_id:
                customer_id = rental.customer.id

        customer = Customer.objects.filter(id=customer_id).first()
        if not customer:
            return Response({"detail": "Customer is required."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            now_dt = timezone.now()
            p_count = Payment.objects.count() + 1
            pay_id_str = f"PAY-{now_dt.year}-{p_count:04d}"

            payment = Payment.objects.create(
                payment_id=pay_id_str,
                rental=rental,
                customer=customer,
                payment_amount=amount,
                payment_date=now_dt,
                payment_method=payment_method,
                transaction_reference=reference,
                payment_type=payment_type,
                payment_status='Completed',
                recorded_by=request.user,
                notes=notes
            )

            # Determine ledger categorization
            if payment_type == 'Security Deposit Collection':
                entry_type = 'Credit'
                category = 'Security Deposit Liability'
                desc = f"Security deposit collection for rental {rental.rental_id if rental else 'N/A'}"
                # Update deposit record
                if rental:
                    dep, _ = SecurityDeposit.objects.get_or_create(rental=rental, defaults={'customer': customer})
                    dep.total_collected += amount
                    dep.save()
            elif payment_type == 'Deposit Refund':
                entry_type = 'Debit'
                category = 'Deposit Refund'
                desc = f"Security deposit refund for rental {rental.rental_id if rental else 'N/A'}"
                if rental:
                    dep, _ = SecurityDeposit.objects.get_or_create(rental=rental, defaults={'customer': customer})
                    dep.total_refunded += amount
                    dep.save()
            elif payment_type == 'Late Fee':
                entry_type = 'Credit'
                category = 'Late Fee Revenue'
                desc = f"Late fee payment for rental {rental.rental_id if rental else 'N/A'}"
            elif payment_type == 'Damage Charge':
                entry_type = 'Credit'
                category = 'Damage Fee Recovery'
                desc = f"Damage charges payment for rental {rental.rental_id if rental else 'N/A'}"
            else:
                entry_type = 'Credit'
                category = 'Rental Revenue'
                desc = f"Rental charges payment for {rental.rental_id if rental else 'Customer dues'}"

            led_count = LedgerEntry.objects.count() + 1
            LedgerEntry.objects.create(
                entry_number=f"LED-{now_dt.year}-{led_count:05d}",
                entry_type=entry_type,
                category=category,
                amount=amount,
                description=desc,
                payment=payment,
                rental=rental,
                customer=customer
            )

            # Recalculate rental balances
            if rental:
                rental.recalculate_totals()

            Notification.objects.create(
                title=f"Payment Received: ₹{amount}",
                message=f"Received ₹{amount} via {payment_method} from {customer.full_name} ({payment_type}).",
                notification_type='general'
            )

        serializer = self.get_serializer(payment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        payment = self.get_object()
        return Response({
            'company': {
                'name': 'EQUIPRENT PRO',
                'gstin': '07AAAAA0000A1Z5',
                'phone': '+91 98765 43210',
                'address': 'Industrial Area, Phase 2, New Delhi'
            },
            'payment_id': payment.payment_id,
            'receipt_date': payment.payment_date,
            'amount': payment.payment_amount,
            'method': payment.payment_method,
            'reference': payment.transaction_reference,
            'type': payment.payment_type,
            'status': payment.payment_status,
            'customer': {
                'name': payment.customer.full_name,
                'phone': payment.customer.phone_number,
                'email': payment.customer.email,
            },
            'rental': {
                'rental_id': payment.rental.rental_id if payment.rental else None,
                'total_amount': payment.rental.total_amount if payment.rental else None,
                'paid_amount': payment.rental.paid_amount if payment.rental else None,
                'outstanding_balance': payment.rental.outstanding_balance if payment.rental else None,
            } if payment.rental else None,
            'recorded_by': payment.recorded_by.get_full_name() if payment.recorded_by else 'Staff'
        })


class LedgerEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LedgerEntry.objects.all().select_related('payment', 'rental', 'customer').order_by('-entry_date')
    serializer_class = LedgerEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        entry_type = self.request.query_params.get('type', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)

        if category:
            queryset = queryset.filter(category=category)
        if entry_type:
            queryset = queryset.filter(entry_type=entry_type)
        if start_date:
            queryset = queryset.filter(entry_date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(entry_date__date__lte=end_date)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        today = timezone.now().date()
        today_entries = LedgerEntry.objects.filter(entry_date__date=today)
        
        today_cash = sum(
            (e.amount for e in today_entries if e.payment and e.payment.payment_method == 'Cash' and e.entry_type == 'Credit'),
            Decimal('0.00')
        )
        today_total_credit = sum(
            (e.amount for e in today_entries if e.entry_type == 'Credit'),
            Decimal('0.00')
        )
        today_total_debit = sum(
            (e.amount for e in today_entries if e.entry_type == 'Debit'),
            Decimal('0.00')
        )

        all_deposits_held = sum((d.remaining_held for d in SecurityDeposit.objects.filter(status__in=['Held', 'Partially Refunded'])), Decimal('0.00'))

        return Response({
            'today_cash_collection': today_cash,
            'today_total_collected': today_total_credit,
            'today_total_refunded': today_total_debit,
            'security_deposit_liability': all_deposits_held,
        })


class SecurityDepositViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SecurityDeposit.objects.all().select_related('rental', 'customer').order_by('-updated_at')
    serializer_class = SecurityDepositSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().select_related('customer', 'rental').order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        rental_id = self.request.query_params.get('rental', None)
        customer_id = self.request.query_params.get('customer', None)
        status_param = self.request.query_params.get('status', None)
        search = self.request.query_params.get('search', None)

        if rental_id:
            queryset = queryset.filter(rental_id=rental_id)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if search:
            queryset = queryset.filter(
                models.Q(invoice_number__icontains=search) |
                models.Q(customer__full_name__icontains=search) |
                models.Q(customer__company_name__icontains=search) |
                models.Q(gstin__icontains=search) |
                models.Q(po_number__icontains=search)
            )
        return queryset
