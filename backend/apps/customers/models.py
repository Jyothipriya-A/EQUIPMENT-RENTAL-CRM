from django.db import models
from django.utils import timezone
from decimal import Decimal

class Customer(models.Model):
    TYPE_INDIVIDUAL = 'individual'
    TYPE_COMPANY = 'company'

    CUSTOMER_TYPE_CHOICES = [
        (TYPE_INDIVIDUAL, 'Individual Customer'),
        (TYPE_COMPANY, 'Company / Business Customer'),
    ]

    ID_AADHAAR = 'Aadhaar'
    ID_DRIVING_LICENSE = 'Driving License'
    ID_PASSPORT = 'Passport'
    ID_VOTER_ID = 'Voter ID'
    ID_PAN = 'PAN Card'
    ID_GSTIN = 'Company GSTIN'

    ID_PROOF_CHOICES = [
        (ID_AADHAAR, 'Aadhaar Card'),
        (ID_DRIVING_LICENSE, 'Driving License'),
        (ID_PASSPORT, 'Passport'),
        (ID_VOTER_ID, 'Voter ID'),
        (ID_PAN, 'PAN Card'),
        (ID_GSTIN, 'Company GSTIN'),
    ]

    customer_type = models.CharField(
        max_length=20,
        choices=CUSTOMER_TYPE_CHOICES,
        default=TYPE_INDIVIDUAL,
        db_index=True
    )

    # Individual / Primary fields
    full_name = models.CharField(max_length=150, db_index=True)
    phone_number = models.CharField(max_length=30, unique=True, db_index=True)
    email = models.EmailField(blank=True, null=True, db_index=True)
    address = models.TextField(blank=True, null=True)
    id_proof_type = models.CharField(max_length=50, choices=ID_PROOF_CHOICES, default=ID_AADHAAR)
    id_proof_number = models.CharField(max_length=100, blank=True, null=True)
    registration_date = models.DateField(default=timezone.localdate)
    notes = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    # Company / Business Specific fields
    company_name = models.CharField(max_length=200, blank=True, null=True, db_index=True)
    company_type = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Pvt Ltd, LLP, Partnership, Sole Proprietor")
    gstin = models.CharField(max_length=25, blank=True, null=True, db_index=True)
    company_email = models.EmailField(blank=True, null=True)
    billing_address = models.TextField(blank=True, null=True)
    po_number = models.CharField(max_length=100, blank=True, null=True, help_text="Default Purchase Order number")
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    credit_approved = models.BooleanField(default=False)
    payment_terms_days = models.IntegerField(default=15, help_text="Credit payment window in days")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.customer_type == self.TYPE_COMPANY and self.company_name:
            return f"{self.company_name} (Attn: {self.full_name})"
        return f"{self.full_name} ({self.phone_number})"

    @property
    def display_name(self):
        if self.customer_type == self.TYPE_COMPANY and self.company_name:
            return f"{self.company_name} - {self.full_name}"
        return self.full_name

    @property
    def total_rentals_count(self):
        return self.rentals.count()

    @property
    def active_rentals_count(self):
        return self.rentals.filter(rental_status__in=['Confirmed', 'Dispatched', 'Active', 'Partially Returned', 'Return Pending Inspection', 'Overdue']).count()

    @property
    def total_outstanding_dues(self):
        # sum of outstanding_balance on non-cancelled and non-completed rentals
        rentals = self.rentals.exclude(rental_status__in=['Cancelled', 'Draft'])
        total = sum((r.outstanding_balance for r in rentals), Decimal('0.00'))
        return total

    @property
    def held_deposits(self):
        active_rentals = self.rentals.filter(rental_status__in=['Reserved', 'Confirmed', 'Dispatched', 'Active', 'Partially Returned', 'Return Pending Inspection', 'Overdue'])
        return sum((r.security_deposit for r in active_rentals), Decimal('0.00'))


class CompanyContact(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Site Supervisor, Procurement Manager, Director")
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', 'name']

    def __str__(self):
        return f"{self.name} ({self.designation or 'Contact'}) - {self.customer.company_name or self.customer.full_name}"
