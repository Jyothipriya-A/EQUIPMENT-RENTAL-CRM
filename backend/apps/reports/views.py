from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.db import models
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta
from decimal import Decimal
import csv

from apps.inventory.models import Product, Asset, Category
from apps.customers.models import Customer
from apps.rentals.models import Rental, RentalItem, DispatchRecord, ReturnRecord
from apps.billing.models import Payment, LedgerEntry, SecurityDeposit

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        first_day_of_month = today.replace(day=1)

        total_products = Product.objects.count()
        total_assets = Asset.objects.count()
        available_assets = Asset.objects.filter(availability_status='Available').count()
        rented_assets = Asset.objects.filter(availability_status='Rented').count()
        reserved_assets = Asset.objects.filter(availability_status='Reserved').count()
        total_customers = Customer.objects.count()
        
        active_rentals = Rental.objects.filter(
            rental_status__in=['Confirmed', 'Dispatched', 'Partially Returned', 'Overdue']
        ).count()
        
        overdue_rentals = Rental.objects.filter(
            rental_status__in=['Dispatched', 'Partially Returned', 'Overdue'],
            expected_return_date__lt=today
        ).count()

        todays_bookings = Rental.objects.filter(booking_date__date=today).count()

        # Monthly revenue: sum of completed payments in current month excluding deposit refunds
        monthly_payments = Payment.objects.filter(
            payment_date__date__gte=first_day_of_month,
            payment_status='Completed'
        ).exclude(payment_type='Deposit Refund')
        monthly_revenue = sum((p.payment_amount for p in monthly_payments), Decimal('0.00'))

        # Pending payments across all non-cancelled rentals
        all_active_rentals = Rental.objects.exclude(rental_status__in=['Cancelled', 'Draft'])
        pending_payments = sum((r.outstanding_balance for r in all_active_rentals), Decimal('0.00'))

        # Security deposits held
        deposits_held = sum((d.remaining_held for d in SecurityDeposit.objects.filter(status__in=['Held', 'Partially Refunded'])), Decimal('0.00'))

        # Utilization percentage
        utilization_pct = round((rented_assets / total_assets * 100), 1) if total_assets > 0 else 0.0

        # Revenue trend: Last 14 days
        daily_revenue_list = []
        for i in range(13, -1, -1):
            target_date = today - timedelta(days=i)
            day_str = target_date.strftime('%b %d')
            payments_on_day = Payment.objects.filter(
                payment_date__date=target_date,
                payment_status='Completed'
            ).exclude(payment_type='Deposit Refund')
            day_total = sum((p.payment_amount for p in payments_on_day), Decimal('0.00'))
            
            rentals_count = Rental.objects.filter(rental_start_date=target_date).count()
            daily_revenue_list.append({
                'date': day_str,
                'full_date': target_date.strftime('%Y-%m-%d'),
                'revenue': float(day_total),
                'rentals_count': rentals_count
            })

        # Most rented equipment
        most_rented = []
        popular_products = Product.objects.annotate(
            rent_count=models.Count('rental_items')
        ).order_by('-rent_count')[:6]
        for p in popular_products:
            most_rented.append({
                'id': p.id,
                'name': p.name,
                'category': p.category.name,
                'code': p.product_code,
                'rent_count': p.rent_count,
                'rate': float(p.daily_rental_rate)
            })

        # Recent rental transactions
        recent_rentals = Rental.objects.select_related('customer').order_by('-created_at')[:8]
        recent_transactions = [{
            'id': r.id,
            'rental_id': r.rental_id,
            'customer_name': r.customer.full_name,
            'total_amount': float(r.total_amount),
            'status': r.rental_status,
            'date': r.booking_date.strftime('%Y-%m-%d %H:%M')
        } for r in recent_rentals]

        # Overdue alerts
        overdue_qs = Rental.objects.filter(
            rental_status__in=['Dispatched', 'Partially Returned', 'Overdue'],
            expected_return_date__lt=today
        ).select_related('customer')[:5]
        overdue_alerts = [{
            'id': r.id,
            'rental_id': r.rental_id,
            'customer_name': r.customer.full_name,
            'phone': r.customer.phone_number,
            'expected_return': r.expected_return_date.strftime('%Y-%m-%d'),
            'days_overdue': (today - r.expected_return_date).days
        } for r in overdue_qs]

        # Upcoming returns (next 5 days)
        future_5 = today + timedelta(days=5)
        upcoming_returns_qs = Rental.objects.filter(
            rental_status__in=['Dispatched', 'Partially Returned'],
            expected_return_date__gte=today,
            expected_return_date__lte=future_5
        ).select_related('customer')[:5]
        upcoming_returns = [{
            'id': r.id,
            'rental_id': r.rental_id,
            'customer_name': r.customer.full_name,
            'phone': r.customer.phone_number,
            'expected_return': r.expected_return_date.strftime('%Y-%m-%d')
        } for r in upcoming_returns_qs]

        maintenance_assets = Asset.objects.filter(availability_status__in=['Under Maintenance', 'Maintenance']).count()
        todays_dispatches = DispatchRecord.objects.filter(dispatch_time__date=today).count()
        todays_returns = ReturnRecord.objects.filter(return_time__date=today).count()

        return Response({
            'total_products': total_products,
            'total_physical_assets': total_assets,
            'available_assets': available_assets,
            'currently_rented_assets': rented_assets,
            'reserved_assets': reserved_assets,
            'assets_under_maintenance': maintenance_assets,
            'total_customers': total_customers,
            'active_rentals': active_rentals,
            'overdue_rentals': overdue_rentals,
            'todays_bookings': todays_bookings,
            'todays_dispatches': todays_dispatches,
            'todays_returns': todays_returns,
            'monthly_revenue': float(monthly_revenue),
            'pending_payments': float(pending_payments),
            'outstanding_balances': float(pending_payments),
            'security_deposits_held': float(deposits_held),
            'product_utilization_pct': utilization_pct,
            'revenue_chart': daily_revenue_list,
            'most_rented_equipment': most_rented,
            'recent_transactions': recent_transactions,
            'overdue_alerts': overdue_alerts,
            'upcoming_returns': upcoming_returns
        })


class RevenueReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        payments = Payment.objects.filter(payment_status='Completed').select_related('customer', 'rental')
        if start_date_str:
            payments = payments.filter(payment_date__date__gte=start_date_str)
        if end_date_str:
            payments = payments.filter(payment_date__date__lte=end_date_str)

        total_collected = sum(
            (p.payment_amount for p in payments if p.payment_type != 'Deposit Refund'),
            Decimal('0.00')
        )
        total_refunded = sum(
            (p.payment_amount for p in payments if p.payment_type == 'Deposit Refund'),
            Decimal('0.00')
        )
        net_revenue = total_collected - total_refunded

        by_method = {}
        for p in payments:
            m = p.payment_method
            by_method[m] = by_method.get(m, Decimal('0.00')) + p.payment_amount

        by_type = {}
        for p in payments:
            t = p.payment_type
            by_type[t] = by_type.get(t, Decimal('0.00')) + p.payment_amount

        return Response({
            'total_collected': float(total_collected),
            'total_refunded': float(total_refunded),
            'net_revenue': float(net_revenue),
            'by_method': {k: float(v) for k, v in by_method.items()},
            'by_type': {k: float(v) for k, v in by_type.items()},
        })


class ExportCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        export_type = request.query_params.get('type', 'rentals')
        response = HttpResponse(content_type='text/csv')
        writer = csv.writer(response)

        if export_type == 'rentals':
            response['Content-Disposition'] = 'attachment; filename="rentals_report.csv"'
            writer.writerow(['Rental ID', 'Customer', 'Phone', 'Start Date', 'Return Date', 'Status', 'Charges', 'Deposit', 'Total', 'Paid', 'Balance'])
            for r in Rental.objects.select_related('customer').all():
                writer.writerow([
                    r.rental_id, r.customer.full_name, r.customer.phone_number,
                    r.rental_start_date, r.expected_return_date, r.rental_status,
                    r.rental_charges, r.security_deposit, r.total_amount, r.paid_amount, r.outstanding_balance
                ])

        elif export_type == 'revenue':
            response['Content-Disposition'] = 'attachment; filename="revenue_payments_report.csv"'
            writer.writerow(['Payment ID', 'Rental ID', 'Customer', 'Date', 'Method', 'Type', 'Status', 'Amount', 'Reference'])
            for p in Payment.objects.select_related('customer', 'rental').all():
                writer.writerow([
                    p.payment_id, p.rental.rental_id if p.rental else 'N/A', p.customer.full_name,
                    p.payment_date.strftime('%Y-%m-%d %H:%M'), p.payment_method, p.payment_type,
                    p.payment_status, p.payment_amount, p.transaction_reference
                ])

        elif export_type == 'assets':
            response['Content-Disposition'] = 'attachment; filename="assets_inventory_report.csv"'
            writer.writerow(['Asset ID', 'Product', 'Code', 'Category', 'Serial Number', 'Condition', 'Status', 'Location', 'Purchase Cost'])
            for a in Asset.objects.select_related('product', 'product__category').all():
                writer.writerow([
                    a.asset_id, a.product.name, a.product.product_code, a.product.category.name,
                    a.serial_number, a.current_condition, a.availability_status, a.location, a.purchase_cost
                ])

        elif export_type == 'customers':
            response['Content-Disposition'] = 'attachment; filename="customers_report.csv"'
            writer.writerow(['Customer Name', 'Phone', 'Email', 'ID Proof', 'ID Number', 'Total Rentals', 'Outstanding Dues'])
            for c in Customer.objects.all():
                writer.writerow([
                    c.full_name, c.phone_number, c.email or '', c.id_proof_type,
                    c.id_proof_number, c.total_rentals_count, c.total_outstanding_dues
                ])

        return response
