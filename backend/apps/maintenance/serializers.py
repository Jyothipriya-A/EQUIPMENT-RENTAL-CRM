from rest_framework import serializers
from .models import MaintenanceRecord

class MaintenanceRecordSerializer(serializers.ModelSerializer):
    asset_serial = serializers.ReadOnlyField(source='asset.serial_number')
    product_name = serializers.ReadOnlyField(source='asset.product.name')
    product_code = serializers.ReadOnlyField(source='asset.product.product_code')
    assigned_staff_name = serializers.ReadOnlyField(source='assigned_staff.get_full_name')

    class Meta:
        model = MaintenanceRecord
        fields = [
            'id', 'maintenance_id', 'asset', 'asset_serial', 'product_name', 'product_code',
            'maintenance_type', 'issue_description', 'start_date', 'expected_completion_date',
            'actual_completion_date', 'maintenance_cost', 'assigned_staff', 'assigned_staff_name',
            'status', 'resolution_notes', 'created_at', 'updated_at'
        ]
