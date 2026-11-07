from django.db import models

class Notification(models.Model):
    TYPE_UPCOMING_RETURN = 'return_due'
    TYPE_OVERDUE = 'overdue'
    TYPE_NEW_BOOKING = 'new_booking'
    TYPE_PENDING_PAYMENT = 'payment_pending'
    TYPE_MAINTENANCE = 'maintenance'
    TYPE_DAMAGED = 'damaged'
    TYPE_LOW_STOCK = 'low_stock'
    TYPE_GENERAL = 'general'

    TYPE_CHOICES = [
        (TYPE_UPCOMING_RETURN, 'Upcoming Return'),
        (TYPE_OVERDUE, 'Overdue Rental'),
        (TYPE_NEW_BOOKING, 'New Booking'),
        (TYPE_PENDING_PAYMENT, 'Pending Payment'),
        (TYPE_MAINTENANCE, 'Maintenance Request'),
        (TYPE_DAMAGED, 'Damaged Asset Alert'),
        (TYPE_LOW_STOCK, 'Low Asset Availability'),
        (TYPE_GENERAL, 'General Notice'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default=TYPE_GENERAL)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title}"
