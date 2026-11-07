from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models, transaction
from django.utils import timezone
from .models import MaintenanceRecord
from .serializers import MaintenanceRecordSerializer
from apps.inventory.models import Asset
from apps.billing.models import LedgerEntry
from apps.notifications.models import Notification

class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceRecord.objects.all().select_related('asset', 'asset__product', 'assigned_staff').order_by('-start_date')
    serializer_class = MaintenanceRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        asset_id = self.request.query_params.get('asset', None)
        search = self.request.query_params.get('search', None)

        if status_param:
            queryset = queryset.filter(status=status_param)
        if asset_id:
            queryset = queryset.filter(asset_id=asset_id)
        if search:
            queryset = queryset.filter(
                models.Q(maintenance_id__icontains=search) |
                models.Q(asset__serial_number__icontains=search) |
                models.Q(asset__product__name__icontains=search) |
                models.Q(issue_description__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        now_dt = timezone.now()
        count = MaintenanceRecord.objects.count() + 1
        mnt_id = f"MNT-{now_dt.year}-{count:04d}"
        record = serializer.save(maintenance_id=mnt_id)

        Notification.objects.create(
            title=f"Maintenance Created: {mnt_id}",
            message=f"Asset {record.asset.serial_number} placed under maintenance ({record.maintenance_type}).",
            notification_type='maintenance',
            link="/admin/maintenance"
        )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        record = self.get_object()
        cost = request.data.get('maintenance_cost', record.maintenance_cost)
        resolution = request.data.get('resolution_notes', 'Maintenance successfully completed and tested.')
        asset_condition = request.data.get('asset_condition', 'Good')

        with transaction.atomic():
            record.status = 'Completed'
            record.actual_completion_date = timezone.now().date()
            record.maintenance_cost = cost
            record.resolution_notes = resolution
            record.save()

            # Update asset
            asset = record.asset
            asset.availability_status = 'Available'
            asset.current_condition = asset_condition
            asset.save()

            # Record in Ledger if maintenance cost > 0
            if float(cost) > 0:
                led_count = LedgerEntry.objects.count() + 1
                now_dt = timezone.now()
                LedgerEntry.objects.create(
                    entry_number=f"LED-{now_dt.year}-{led_count:05d}",
                    entry_type='Debit',
                    category='Maintenance Expense',
                    amount=cost,
                    description=f"Maintenance expense for {asset.product.name} ({asset.serial_number}) - {record.maintenance_id}"
                )

            Notification.objects.create(
                title=f"Maintenance Completed: {record.maintenance_id}",
                message=f"Asset {asset.serial_number} is now Available in condition: {asset_condition}.",
                notification_type='maintenance'
            )

        return Response(MaintenanceRecordSerializer(record).data)
