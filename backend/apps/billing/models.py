from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.customers.models import Customer
from apps.rentals.models import Rental

class Payment(models.Model):
    METHOD_CASH = 'Cash'
    METHOD_UPI = 'UPI'
    METHOD_CARD = 'Card'
    METHOD_BANK_TRANSFER = 'Bank Transfer'
    METHOD_OTHER = 'Other'

    METHOD_CHOICES = [
        (METHOD_CASH, 'Cash'),
        (METHOD_UPI, 'UPI'),
        (METHOD_CARD, 'Card'),
        (METHOD_BANK_TRANSFER, 'Bank Transfer'),
        (METHOD_OTHER, 'Other'),
    ]

    TYPE_ADVANCE_PAYMENT = 'Advance Payment'
    TYPE_FULL_PAYMENT = 'Full Payment'
    TYPE_PARTIAL_PAYMENT = 'Partial Payment'
    TYPE_RENTAL_PAYMENT = 'Rental Payment'
    TYPE_DEPOSIT_COLLECTION = 'Security Deposit Collection'
    TYPE_FINAL_SETTLEMENT = 'Final Settlement'
    TYPE_LATE_FEE = 'Late Fee'
    TYPE_DAMAGE_CHARGE = 'Damage Charge'
    TYPE_DEPOSIT_REFUND = 'Deposit Refund'
    TYPE_ADDITIONAL_CHARGE = 'Additional Charge'

    TYPE_CHOICES = [
        (TYPE_ADVANCE_PAYMENT, 'Advance Payment'),
        (TYPE_FULL_PAYMENT, 'Full Payment'),
        (TYPE_PARTIAL_PAYMENT, 'Partial Payment'),
        (TYPE_RENTAL_PAYMENT, 'Rental Payment'),
        (TYPE_DEPOSIT_COLLECTION, 'Security Deposit Collection'),
        (TYPE_FINAL_SETTLEMENT, 'Final Settlement'),
        (TYPE_LATE_FEE, 'Late Fee'),
        (TYPE_DAMAGE_CHARGE, 'Damage Charge'),
        (TYPE_DEPOSIT_REFUND, 'Deposit Refund'),
        (TYPE_ADDITIONAL_CHARGE, 'Additional Charge'),
    ]

    STATUS_COMPLETED = 'Completed'
    STATUS_PENDING = 'Pending'
    STATUS_FAILED = 'Failed'
    STATUS_REFUNDED = 'Refunded'

    STATUS_CHOICES = [
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_PENDING, 'Pending'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REFUNDED, 'Refunded'),
    ]

    payment_id = models.CharField(max_length=50, unique=True, db_index=True)
    rental = models.ForeignKey(Rental, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='payments')
    payment_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateTimeField(default=timezone.now)
    payment_method = models.CharField(max_length=30, choices=METHOD_CHOICES, default=METHOD_UPI)
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    payment_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default=TYPE_RENTAL_PAYMENT)
    payment_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_COMPLETED)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.payment_id} - ₹{self.payment_amount} ({self.payment_type}) [{self.payment_status}]"


class Invoice(models.Model):
    STATUS_ISSUED = 'Issued'
    STATUS_PARTIALLY_PAID = 'Partially Paid'
    STATUS_PAID = 'Paid'
    STATUS_OVERDUE = 'Overdue'
    STATUS_CANCELLED = 'Cancelled'

    STATUS_CHOICES = [
        (STATUS_ISSUED, 'Issued'),
        (STATUS_PARTIALLY_PAID, 'Partially Paid'),
        (STATUS_PAID, 'Paid'),
        (STATUS_OVERDUE, 'Overdue'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='invoices')
    gstin = models.CharField(max_length=25, blank=True, null=True)
    po_number = models.CharField(max_length=100, blank=True, null=True)
    invoice_date = models.DateField(default=timezone.localdate)
    due_date = models.DateField(null=True, blank=True)
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_ISSUED)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Invoice {self.invoice_number} - ₹{self.grand_total} [{self.status}]"


class LedgerEntry(models.Model):
    TYPE_DEBIT = 'Debit'
    TYPE_CREDIT = 'Credit'

    TYPE_CHOICES = [
        (TYPE_DEBIT, 'Debit'),
        (TYPE_CREDIT, 'Credit'),
    ]

    CAT_RENTAL_REVENUE = 'Rental Revenue'
    CAT_DEPOSIT_LIABILITY = 'Security Deposit Liability'
    CAT_DEPOSIT_REFUND = 'Deposit Refund'
    CAT_LATE_FEE = 'Late Fee Revenue'
    CAT_DAMAGE_FEE = 'Damage Fee Recovery'
    CAT_MAINTENANCE_EXPENSE = 'Maintenance Expense'
    CAT_OTHER = 'Other'

    CATEGORY_CHOICES = [
        (CAT_RENTAL_REVENUE, 'Rental Revenue'),
        (CAT_DEPOSIT_LIABILITY, 'Security Deposit Liability'),
        (CAT_DEPOSIT_REFUND, 'Deposit Refund'),
        (CAT_LATE_FEE, 'Late Fee Revenue'),
        (CAT_DAMAGE_FEE, 'Damage Fee Recovery'),
        (CAT_MAINTENANCE_EXPENSE, 'Maintenance Expense'),
        (CAT_OTHER, 'Other'),
    ]

    entry_number = models.CharField(max_length=50, unique=True, db_index=True)
    entry_date = models.DateTimeField(default=timezone.now)
    entry_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField()
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='ledger_entries')
    rental = models.ForeignKey(Rental, on_delete=models.SET_NULL, null=True, blank=True, related_name='ledger_entries')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='ledger_entries')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-entry_date']
        verbose_name_plural = 'Ledger entries'

    def __str__(self):
        return f"{self.entry_number} [{self.entry_type}] ₹{self.amount} - {self.category}"


class SecurityDeposit(models.Model):
    STATUS_HELD = 'Held'
    STATUS_PARTIAL_REFUNDED = 'Partially Refunded'
    STATUS_FULLY_REFUNDED = 'Fully Refunded'
    STATUS_FORFEITED = 'Forfeited'

    STATUS_CHOICES = [
        (STATUS_HELD, 'Held'),
        (STATUS_PARTIAL_REFUNDED, 'Partially Refunded'),
        (STATUS_FULLY_REFUNDED, 'Fully Refunded'),
        (STATUS_FORFEITED, 'Forfeited'),
    ]

    rental = models.OneToOneField(Rental, on_delete=models.CASCADE, related_name='deposit_record')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='security_deposits')
    total_collected = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deducted = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_refunded = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_HELD)
    notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def remaining_held(self):
        return max(0, self.total_collected - (self.total_deducted + self.total_refunded))

    def __str__(self):
        return f"Deposit for {self.rental.rental_id}: Collected ₹{self.total_collected}, Status: {self.status}"
