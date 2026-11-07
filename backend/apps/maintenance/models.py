from django.db import models
from django.conf import settings
from apps.inventory.models import Asset

class MaintenanceRecord(models.Model):
    TYPE_ROUTINE = 'Routine Inspection'
    TYPE_REPAIR = 'Repair'
    TYPE_PARTS_REPLACEMENT = 'Parts Replacement'
    TYPE_CALIBRATION = 'Cleaning & Calibration'
    TYPE_EMERGENCY = 'Emergency Repair'

    TYPE_CHOICES = [
        (TYPE_ROUTINE, 'Routine Inspection'),
        (TYPE_REPAIR, 'Repair'),
        (TYPE_PARTS_REPLACEMENT, 'Parts Replacement'),
        (TYPE_CALIBRATION, 'Cleaning & Calibration'),
        (TYPE_EMERGENCY, 'Emergency Repair'),
    ]

    STATUS_REPORTED = 'Reported'
    STATUS_UNDER_INSPECTION = 'Under Inspection'
    STATUS_IN_REPAIR = 'In Repair'
    STATUS_PENDING = 'Pending'
    STATUS_IN_PROGRESS = 'In Progress'
    STATUS_COMPLETED = 'Completed'
    STATUS_CANCELLED = 'Cancelled'

    STATUS_CHOICES = [
        (STATUS_REPORTED, 'Reported'),
        (STATUS_UNDER_INSPECTION, 'Under Inspection'),
        (STATUS_IN_REPAIR, 'In Repair'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    maintenance_id = models.CharField(max_length=50, unique=True, db_index=True)
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='maintenance_records')
    maintenance_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default=TYPE_ROUTINE)
    issue_description = models.TextField()
    service_provider = models.CharField(max_length=150, blank=True, null=True, help_text="Internal workshop or external vendor")
    start_date = models.DateField()
    expected_completion_date = models.DateField()
    actual_completion_date = models.DateField(null=True, blank=True)
    maintenance_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    assigned_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_maintenances'
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_REPORTED, db_index=True)
    resolution_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.maintenance_id} - {self.asset.serial_number} [{self.status}]"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Enforce business rule: Assets under maintenance must automatically become unavailable for rental
        if self.status in [self.STATUS_REPORTED, self.STATUS_UNDER_INSPECTION, self.STATUS_IN_REPAIR, self.STATUS_PENDING, self.STATUS_IN_PROGRESS]:
            if self.asset.availability_status != Asset.STATUS_UNDER_MAINTENANCE and self.asset.availability_status != Asset.STATUS_MAINTENANCE:
                self.asset.availability_status = Asset.STATUS_UNDER_MAINTENANCE
                self.asset.save(update_fields=['availability_status'])
        elif self.status == self.STATUS_COMPLETED:
            if self.asset.availability_status in [Asset.STATUS_UNDER_MAINTENANCE, Asset.STATUS_MAINTENANCE]:
                self.asset.availability_status = Asset.STATUS_AVAILABLE
                self.asset.save(update_fields=['availability_status'])
