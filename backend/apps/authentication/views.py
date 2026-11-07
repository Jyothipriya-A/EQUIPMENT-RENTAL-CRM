from rest_framework import generics, status, viewsets, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db import models
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    StaffCreateSerializer,
    StaffUpdateSerializer
)
from .permissions import IsAdminUserRole

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class StaffViewSet(viewsets.ModelViewSet):
    """
    Staff management viewset for Admin.
    """
    queryset = User.objects.all().select_related('staff_profile').order_by('-date_joined')
    permission_classes = [IsAdminUserRole]

    def get_serializer_class(self):
        if self.action == 'create':
            return StaffCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return StaffUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        search = self.request.query_params.get('search', None)

        if role:
            queryset = queryset.filter(role=role)
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(username__icontains=search) |
                models.Q(phone__icontains=search)
            )
        return queryset

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            raise serializers.ValidationError({"detail": "You cannot delete your own account."})
        instance.is_active = False
        instance.save()


import os
import json
from django.conf import settings as django_settings

SETTINGS_FILE = os.path.join(django_settings.BASE_DIR, 'system_settings.json')

DEFAULT_SETTINGS = {
    "company_name": "EquipRent Pro Heavy Tools Ltd.",
    "phone": "+91 98765 43210",
    "email": "support@rentalcrm.com",
    "address": "Plot 42, Industrial Area Phase II, Bengaluru, Karnataka 560058",
    "gstin": "29ABCDE1234F1Z5",
    "currency": "INR (₹)",
    "currency_symbol": "₹",
    "default_tax_rate": 18.0,
    "default_late_fee_per_day": 500.0,
    "default_security_deposit_pct": 25.0,
    "grace_period_hours": 2,
    "require_kyc": True,
    "max_advance_booking_days": 90,
}

class SystemSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, 'w') as f:
                json.dump(DEFAULT_SETTINGS, f, indent=2)
            return Response(DEFAULT_SETTINGS)
        try:
            with open(SETTINGS_FILE, 'r') as f:
                data = json.load(f)
            return Response(data)
        except Exception:
            return Response(DEFAULT_SETTINGS)

    def put(self, request):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({'detail': 'Only administrators can modify system settings.'}, status=status.HTTP_403_FORBIDDEN)
        
        current = DEFAULT_SETTINGS.copy()
        if os.path.exists(SETTINGS_FILE):
            try:
                with open(SETTINGS_FILE, 'r') as f:
                    current = json.load(f)
            except Exception:
                pass
        
        current.update(request.data)
        with open(SETTINGS_FILE, 'w') as f:
            json.dump(current, f, indent=2)
        return Response(current)
