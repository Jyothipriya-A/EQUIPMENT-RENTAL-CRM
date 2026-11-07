from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, default='Wrench', help_text="Lucide icon name")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Supplier(models.Model):
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=30)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    company_details = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_ARCHIVED = 'archived'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_ARCHIVED, 'Archived'),
    ]

    name = models.CharField(max_length=200)
    product_code = models.CharField(max_length=50, unique=True, db_index=True, help_text="Unique Product Code or SKU")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    description = models.TextField(blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Rental Rates (INR)
    daily_rental_rate = models.DecimalField(max_digits=10, decimal_places=2)
    weekly_rental_rate = models.DecimalField(max_digits=10, decimal_places=2)
    monthly_rental_rate = models.DecimalField(max_digits=10, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    replacement_value = models.DecimalField(max_digits=12, decimal_places=2, default=0, help_text="Total asset replacement value if lost or damaged")
    late_fee_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    default_rental_duration = models.PositiveIntegerField(default=1, help_text="Default rental duration in days")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.product_code})"

    @property
    def total_assets_count(self):
        return self.assets.count()

    @property
    def available_assets_count(self):
        return self.assets.filter(availability_status='Available').count()

    @property
    def rented_assets_count(self):
        return self.assets.filter(availability_status='Rented').count()


class Asset(models.Model):
    CONDITION_EXCELLENT = 'Excellent'
    CONDITION_GOOD = 'Good'
    CONDITION_FAIR = 'Fair'
    CONDITION_NEEDS_REPAIR = 'Needs Repair'
    CONDITION_DAMAGED = 'Damaged'

    CONDITION_CHOICES = [
        (CONDITION_EXCELLENT, 'Excellent'),
        (CONDITION_GOOD, 'Good'),
        (CONDITION_FAIR, 'Fair'),
        (CONDITION_NEEDS_REPAIR, 'Needs Repair'),
        (CONDITION_DAMAGED, 'Damaged'),
    ]

    STATUS_AVAILABLE = 'Available'
    STATUS_RESERVED = 'Reserved'
    STATUS_RENTED = 'Rented'
    STATUS_RETURN_PENDING_INSPECTION = 'Return Pending Inspection'
    STATUS_MAINTENANCE = 'Maintenance'
    STATUS_UNDER_MAINTENANCE = 'Under Maintenance'
    STATUS_DAMAGED = 'Damaged'
    STATUS_RETIRED = 'Retired'

    STATUS_CHOICES = [
        (STATUS_AVAILABLE, 'Available'),
        (STATUS_RESERVED, 'Reserved'),
        (STATUS_RENTED, 'Rented'),
        (STATUS_RETURN_PENDING_INSPECTION, 'Return Pending Inspection'),
        (STATUS_MAINTENANCE, 'Maintenance'),
        (STATUS_UNDER_MAINTENANCE, 'Under Maintenance'),
        (STATUS_DAMAGED, 'Damaged'),
        (STATUS_RETIRED, 'Retired'),
    ]

    asset_id = models.CharField(max_length=50, unique=True, db_index=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='assets')
    serial_number = models.CharField(max_length=100, unique=True, db_index=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='supplied_assets')
    purchase_date = models.DateField(blank=True, null=True)
    purchase_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_condition = models.CharField(max_length=30, choices=CONDITION_CHOICES, default=CONDITION_EXCELLENT)
    availability_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_AVAILABLE, db_index=True)
    location = models.CharField(max_length=150, default='Main Warehouse - Bay 1')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['product__name', 'serial_number']

    def __str__(self):
        return f"{self.product.name} - SN: {self.serial_number} [{self.availability_status}]"

    @property
    def is_bookable(self):
        return self.availability_status == self.STATUS_AVAILABLE
