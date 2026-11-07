from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset().prefetch_related('contacts')
        search = self.request.query_params.get('search', None)
        customer_type = self.request.query_params.get('customer_type', None)
        has_dues = self.request.query_params.get('has_dues', None)

        if customer_type:
            queryset = queryset.filter(customer_type=customer_type)

        if search:
            queryset = queryset.filter(
                models.Q(full_name__icontains=search) |
                models.Q(phone_number__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(company_name__icontains=search) |
                models.Q(gstin__icontains=search) |
                models.Q(id_proof_number__icontains=search)
            )
        if has_dues == 'true':
            queryset = [c for c in queryset if c.total_outstanding_dues > 0]
        return queryset

    @action(detail=True, methods=['get'])
    def rental_history(self, request, pk=None):
        customer = self.get_object()
        rentals = customer.rentals.all().select_related('staff_responsible').prefetch_related('items__asset', 'items__product').order_by('-booking_date')
        
        data = []
        for r in rentals:
            items_summary = ", ".join([f"{item.product.name} ({item.asset.serial_number})" for item in r.items.all()])
            data.append({
                'id': r.id,
                'rental_id': r.rental_id,
                'start_date': r.rental_start_date,
                'expected_return_date': r.expected_return_date,
                'actual_return_date': r.actual_return_date,
                'status': r.rental_status,
                'items_summary': items_summary,
                'total_amount': r.total_amount,
                'paid_amount': r.paid_amount,
                'outstanding_balance': r.outstanding_balance,
                'security_deposit': r.security_deposit,
            })
        return Response(data)

    @action(detail=True, methods=['get'])
    def payments_history(self, request, pk=None):
        customer = self.get_object()
        payments = customer.payments.all().order_by('-payment_date')
        data = [{
            'payment_id': p.payment_id,
            'rental_id': p.rental.rental_id if p.rental else None,
            'amount': p.payment_amount,
            'date': p.payment_date,
            'method': p.payment_method,
            'type': p.payment_type,
            'status': p.payment_status,
            'reference': p.transaction_reference,
        } for p in payments]
        return Response(data)
