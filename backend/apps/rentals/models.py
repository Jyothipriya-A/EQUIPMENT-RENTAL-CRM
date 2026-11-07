from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from apps.customers.models import Customer
from apps.inventory.models import Product, Asset

class Rental(models.Model):
    STATUS_DRAFT = 'Draft'
    STATUS_QUOTATION_SENT = 'Quotation Sent'
    STATUS_RESERVED = 'Reserved'
    STATUS_CONFIRMED = 'Confirmed'
    STATUS_READY_FOR_DISPATCH = 'Ready for Dispatch'
    STATUS_PARTIALLY_DISPATCHED = 'Partially Dispatched'
    STATUS_DISPATCHED = 'Dispatched'
    STATUS_ACTIVE = 'Active'
    STATUS_PARTIALLY_RETURNED = 'Partially Returned'
    STATUS_RETURN_PENDING_INSPECTION = 'Return Pending Inspection'
    STATUS_RETURNED = 'Returned'
    STATUS_COMPLETED = 'Completed'
    STATUS_OVERDUE = 'Overdue'
    STATUS_CANCELLED = 'Cancelled'

    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_QUOTATION_SENT, 'Quotation Sent'),
        (STATUS_RESERVED, 'Reserved'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_READY_FOR_DISPATCH, 'Ready for Dispatch'),
        (STATUS_PARTIALLY_DISPATCHED, 'Partially Dispatched'),
        (STATUS_DISPATCHED, 'Dispatched'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_PARTIALLY_RETURNED, 'Partially Returned'),
        (STATUS_RETURN_PENDING_INSPECTION, 'Return Pending Inspection'),
        (STATUS_RETURNED, 'Returned'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_OVERDUE, 'Overdue'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    rental_id = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='rentals')
    booking_date = models.DateTimeField(default=timezone.now)
    rental_start_date = models.DateField()
    expected_return_date = models.DateField()
    actual_return_date = models.DateField(null=True, blank=True)
    rental_duration = models.PositiveIntegerField(default=1, help_text="Duration in days")
    
    # Quotation Specific Fields
    is_quotation = models.BooleanField(default=False)
    quotation_valid_until = models.DateField(null=True, blank=True)
    converted_from_quotation_at = models.DateTimeField(null=True, blank=True)
    po_number = models.CharField(max_length=100, blank=True, null=True, help_text="Customer Purchase Order #")

    # Financial fields (INR)
    rental_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    rental_status = models.CharField(max_length=35, choices=STATUS_CHOICES, default=STATUS_RESERVED, db_index=True)
    staff_responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_rentals'
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.rental_id} - {self.customer.full_name} [{self.rental_status}]"

    def recalculate_totals(self):
        """Calculate total, paid, and outstanding amounts."""
        self.total_amount = (self.rental_charges + self.delivery_charges - self.discount) + self.tax
        payments = self.payments.filter(payment_status='Completed')
        paid_for_rent = sum(
            (p.payment_amount for p in payments if p.payment_type in ['Rental Payment', 'Advance Payment', 'Full Payment', 'Partial Payment', 'Final Settlement', 'Late Fee', 'Damage Charge', 'Additional Charge']),
            Decimal('0.00')
        )
        self.paid_amount = paid_for_rent
        self.outstanding_balance = max(Decimal('0.00'), self.total_amount - self.paid_amount)
        self.save(update_fields=['total_amount', 'paid_amount', 'outstanding_balance'])

    @property
    def is_overdue(self):
        if self.rental_status in [self.STATUS_DISPATCHED, self.STATUS_ACTIVE, self.STATUS_PARTIALLY_RETURNED, self.STATUS_RETURN_PENDING_INSPECTION]:
            return timezone.now().date() > self.expected_return_date
        return self.rental_status == self.STATUS_OVERDUE


class RentalItem(models.Model):
    STATUS_RESERVED = 'Reserved'
    STATUS_READY = 'Ready for Dispatch'
    STATUS_DISPATCHED = 'Dispatched'
    STATUS_RETURN_PENDING = 'Return Pending Inspection'
    STATUS_RETURNED = 'Returned'
    STATUS_DAMAGED = 'Damaged'

    ITEM_STATUS_CHOICES = [
        (STATUS_RESERVED, 'Reserved'),
        (STATUS_READY, 'Ready for Dispatch'),
        (STATUS_DISPATCHED, 'Dispatched'),
        (STATUS_RETURN_PENDING, 'Return Pending Inspection'),
        (STATUS_RETURNED, 'Returned'),
        (STATUS_DAMAGED, 'Damaged'),
    ]

    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='items')
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT, related_name='rental_items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='rental_items')
    
    daily_rate_applied = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_applied = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    item_status = models.CharField(max_length=30, choices=ITEM_STATUS_CHOICES, default=STATUS_RESERVED)
    
    condition_on_dispatch = models.CharField(max_length=50, default='Good')
    condition_on_return = models.CharField(max_length=50, blank=True, null=True)
    
    dispatched_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.rental.rental_id} - {self.asset.serial_number} ({self.item_status})"


class RentalStatusHistory(models.Model):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=35)
    new_status = models.CharField(max_length=35)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.rental.rental_id}: {self.old_status} -> {self.new_status}"


class RentalExtension(models.Model):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='extensions')
    previous_expected_return_date = models.DateField()
    new_expected_return_date = models.DateField()
    additional_days = models.PositiveIntegerField()
    additional_rental_charges = models.DecimalField(max_digits=12, decimal_places=2)
    additional_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Extension for {self.rental.rental_id}: +{self.additional_days} days until {self.new_expected_return_date}"


class DispatchRecord(models.Model):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='dispatch_records')
    dispatched_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    dispatch_time = models.DateTimeField(default=timezone.now)
    delivery_location = models.CharField(max_length=250, default='Counter Pick-up / Yard')
    accessories_provided = models.TextField(blank=True, null=True, help_text="Charger, cables, safety guard, toolkit etc.")
    customer_signature_name = models.CharField(max_length=150, help_text="Name of person acknowledging dispatch")
    initial_condition_notes = models.TextField(blank=True, null=True)
    is_partial = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-dispatch_time']

    def __str__(self):
        return f"Dispatch for {self.rental.rental_id} at {self.dispatch_time} ({'Partial' if self.is_partial else 'Full'})"


class ReturnRecord(models.Model):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='return_records')
    return_time = models.DateTimeField(default=timezone.now)
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    is_partial = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-return_time']

    def __str__(self):
        return f"Return for {self.rental.rental_id} ({'Partial' if self.is_partial else 'Full'})"


class DamageInspection(models.Model):
    INSPECTION_GOOD = 'Good Condition'
    INSPECTION_MINOR = 'Minor Damage'
    INSPECTION_MAJOR = 'Major Damage'
    INSPECTION_MISSING_PARTS = 'Missing Parts'
    INSPECTION_NOT_WORKING = 'Not Working'

    INSPECTION_RESULT_CHOICES = [
        (INSPECTION_GOOD, 'Good Condition'),
        (INSPECTION_MINOR, 'Minor Damage'),
        (INSPECTION_MAJOR, 'Major Damage'),
        (INSPECTION_MISSING_PARTS, 'Missing Parts'),
        (INSPECTION_NOT_WORKING, 'Not Working'),
    ]

    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='damage_inspections')
    return_record = models.ForeignKey(ReturnRecord, on_delete=models.CASCADE, null=True, blank=True, related_name='inspections')
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT, related_name='damage_inspections')
    
    condition_before = models.CharField(max_length=50, default='Good')
    condition_after = models.CharField(max_length=50)
    inspection_result = models.CharField(max_length=50, choices=INSPECTION_RESULT_CHOICES, default=INSPECTION_GOOD)
    damage_description = models.TextField(blank=True, null=True)
    damage_photograph_url = models.URLField(max_length=500, blank=True, null=True)
    missing_accessories = models.TextField(blank=True, null=True)
    
    # Financial deductions
    damage_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    replacement_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    missing_accessories_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    late_days = models.PositiveIntegerField(default=0)
    late_fee_charged = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refundable_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    inspected_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    inspected_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Inspection: {self.asset.serial_number} [{self.inspection_result}] - Damage: ₹{self.damage_charges}"


class SettlementRecord(models.Model):
    rental = models.OneToOneField(Rental, on_delete=models.CASCADE, related_name='settlement')
    settlement_id = models.CharField(max_length=50, unique=True, db_index=True)
    
    # Financial Breakup
    original_rental_amount = models.DecimalField(max_digits=12, decimal_places=2)
    extension_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    late_fees_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    damage_charges_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    missing_accessories_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    gross_total = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    security_deposit_held = models.DecimalField(max_digits=12, decimal_places=2)
    
    deposit_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deposit_refunded = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    settled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    settled_at = models.DateTimeField(default=timezone.now)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Settlement {self.settlement_id} for {self.rental.rental_id}"
