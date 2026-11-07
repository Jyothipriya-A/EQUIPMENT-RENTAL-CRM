from rest_framework import serializers
from .models import (
    Rental, RentalItem, RentalStatusHistory, DispatchRecord,
    ReturnRecord, DamageInspection, RentalExtension, SettlementRecord
)
from apps.customers.serializers import CustomerSerializer
from apps.inventory.serializers import AssetSerializer, ProductSerializer

class RentalItemSerializer(serializers.ModelSerializer):
    asset_details = AssetSerializer(source='asset', read_only=True)
    product_name = serializers.ReadOnlyField(source='product.name')
    product_code = serializers.ReadOnlyField(source='product.product_code')
    serial_number = serializers.ReadOnlyField(source='asset.serial_number')

    class Meta:
        model = RentalItem
        fields = [
            'id', 'asset', 'asset_details', 'product', 'product_name', 'product_code',
            'serial_number', 'daily_rate_applied', 'deposit_applied', 'item_status',
            'condition_on_dispatch', 'condition_on_return', 'dispatched_at',
            'returned_at', 'notes'
        ]


class RentalExtensionSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.ReadOnlyField(source='approved_by.get_full_name')

    class Meta:
        model = RentalExtension
        fields = [
            'id', 'rental', 'previous_expected_return_date', 'new_expected_return_date',
            'additional_days', 'additional_rental_charges', 'additional_tax',
            'notes', 'approved_by', 'approved_by_name', 'created_at'
        ]


class DispatchRecordSerializer(serializers.ModelSerializer):
    dispatched_by_name = serializers.ReadOnlyField(source='dispatched_by.get_full_name')

    class Meta:
        model = DispatchRecord
        fields = [
            'id', 'rental', 'dispatched_by', 'dispatched_by_name',
            'dispatch_time', 'delivery_location', 'accessories_provided',
            'customer_signature_name', 'initial_condition_notes', 'is_partial', 'created_at'
        ]


class DamageInspectionSerializer(serializers.ModelSerializer):
    asset_serial = serializers.ReadOnlyField(source='asset.serial_number')
    product_name = serializers.ReadOnlyField(source='asset.product.name')
    inspected_by_name = serializers.ReadOnlyField(source='inspected_by.get_full_name')

    class Meta:
        model = DamageInspection
        fields = [
            'id', 'rental', 'return_record', 'asset', 'asset_serial', 'product_name',
            'condition_before', 'condition_after', 'inspection_result', 'damage_description',
            'damage_photograph_url', 'missing_accessories', 'damage_charges', 'replacement_cost',
            'missing_accessories_charge', 'late_days', 'late_fee_charged',
            'refundable_deposit', 'inspected_by', 'inspected_by_name', 'inspected_at'
        ]


class ReturnRecordSerializer(serializers.ModelSerializer):
    received_by_name = serializers.ReadOnlyField(source='received_by.get_full_name')
    inspections = DamageInspectionSerializer(many=True, read_only=True)

    class Meta:
        model = ReturnRecord
        fields = ['id', 'rental', 'return_time', 'received_by', 'received_by_name', 'is_partial', 'notes', 'inspections', 'created_at']


class SettlementRecordSerializer(serializers.ModelSerializer):
    settled_by_name = serializers.ReadOnlyField(source='settled_by.get_full_name')

    class Meta:
        model = SettlementRecord
        fields = [
            'id', 'settlement_id', 'rental', 'original_rental_amount', 'extension_charges',
            'delivery_charges', 'late_fees_total', 'damage_charges_total', 'missing_accessories_total',
            'tax_total', 'gross_total', 'amount_paid', 'security_deposit_held',
            'deposit_deductions', 'deposit_refunded', 'outstanding_balance_collected',
            'settled_by', 'settled_by_name', 'settled_at', 'notes'
        ]


class RentalStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.ReadOnlyField(source='changed_by.get_full_name')

    class Meta:
        model = RentalStatusHistory
        fields = ['id', 'old_status', 'new_status', 'changed_by', 'changed_by_name', 'notes', 'changed_at']


class RentalSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source='customer', read_only=True)
    items = RentalItemSerializer(many=True, read_only=True)
    dispatch_records = DispatchRecordSerializer(many=True, read_only=True)
    return_records = ReturnRecordSerializer(many=True, read_only=True)
    damage_inspections = DamageInspectionSerializer(many=True, read_only=True)
    extensions = RentalExtensionSerializer(many=True, read_only=True)
    settlement = SettlementRecordSerializer(read_only=True)
    status_history = RentalStatusHistorySerializer(many=True, read_only=True)
    staff_name = serializers.ReadOnlyField(source='staff_responsible.get_full_name')
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = Rental
        fields = [
            'id', 'rental_id', 'customer', 'customer_details', 'booking_date',
            'rental_start_date', 'expected_return_date', 'actual_return_date',
            'rental_duration', 'is_quotation', 'quotation_valid_until',
            'converted_from_quotation_at', 'po_number', 'rental_charges',
            'security_deposit', 'delivery_charges', 'discount', 'tax', 'total_amount',
            'paid_amount', 'outstanding_balance', 'rental_status',
            'staff_responsible', 'staff_name', 'notes', 'items', 'dispatch_records',
            'return_records', 'damage_inspections', 'extensions', 'settlement',
            'status_history', 'is_overdue', 'created_at', 'updated_at'
        ]
