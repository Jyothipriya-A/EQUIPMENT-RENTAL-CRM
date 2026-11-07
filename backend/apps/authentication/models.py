from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        if 'username' not in extra_fields or not extra_fields['username']:
            extra_fields['username'] = email.split('@')[0]
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_FRONT_DESK = 'front_desk'
    ROLE_OPERATIONS = 'operations'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_FRONT_DESK, 'Front Desk Staff'),
        (ROLE_OPERATIONS, 'Operations Staff'),
    ]

    email = models.EmailField(_('email address'), unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_FRONT_DESK)
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.URLField(max_length=500, blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser

    @property
    def is_front_desk(self):
        return self.role in [self.ROLE_FRONT_DESK, self.ROLE_ADMIN]

    @property
    def is_operations(self):
        return self.role in [self.ROLE_OPERATIONS, self.ROLE_ADMIN]


class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    employee_id = models.CharField(max_length=30, unique=True)
    department = models.CharField(max_length=100, default='Operations')
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=50, blank=True, null=True)
    joining_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Profile: {self.user.email} - {self.employee_id}"
