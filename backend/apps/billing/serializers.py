from rest_framework import serializers
from .models import Payment, LedgerEntry, SecurityDeposit, Invoice

class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.full_name')
    rental_code = serializers.ReadOnlyField(source='rental.rental_id')
    recorded_by_name = serializers.ReadOnlyField(source='recorded_by.get_full_name')

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_id', 'rental', 'rental_code', 'customer',
            'customer_name', 'payment_amount', 'payment_date', 'payment_method',
            'transaction_reference', 'payment_type', 'payment_status',
            'recorded_by', 'recorded_by_name', 'notes', 'created_at'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.full_name')
    company_name = serializers.ReadOnlyField(source='customer.company_name')
    rental_code = serializers.ReadOnlyField(source='rental.rental_id')

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'rental', 'rental_code', 'customer',
            'customer_name', 'company_name', 'gstin', 'po_number',
            'invoice_date', 'due_date', 'subtotal', 'tax_amount',
            'grand_total', 'paid_amount', 'balance_due', 'status',
            'notes', 'created_at'
        ]


class LedgerEntrySerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.full_name')
    rental_code = serializers.ReadOnlyField(source='rental.rental_id')
    payment_code = serializers.ReadOnlyField(source='payment.payment_id')

    class Meta:
        model = LedgerEntry
        fields = [
            'id', 'entry_number', 'entry_date', 'entry_type', 'category',
            'amount', 'description', 'payment', 'payment_code', 'rental',
            'rental_code', 'customer', 'customer_name', 'created_at'
        ]


class SecurityDepositSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.full_name')
    rental_code = serializers.ReadOnlyField(source='rental.rental_id')
    remaining_held = serializers.ReadOnlyField()

    class Meta:
        model = SecurityDeposit
        fields = [
            'id', 'rental', 'rental_code', 'customer', 'customer_name',
            'total_collected', 'total_deducted', 'total_refunded',
            'remaining_held', 'status', 'notes', 'updated_at'
        ]
