from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import StaffProfile

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['username'] = user.username
        token['role'] = user.role
        token['full_name'] = user.get_full_name() or user.username
        token['is_admin'] = user.is_admin
        token['is_front_desk'] = user.is_front_desk
        token['is_operations'] = user.is_operations
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'role': self.user.role,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'full_name': self.user.get_full_name() or self.user.username,
            'phone': self.user.phone,
            'is_admin': self.user.is_admin,
            'is_front_desk': self.user.is_front_desk,
            'is_operations': self.user.is_operations,
        }
        return data


class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffProfile
        fields = ['employee_id', 'department', 'address', 'emergency_contact', 'joining_date', 'notes']


class UserSerializer(serializers.ModelSerializer):
    staff_profile = StaffProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'is_active', 'date_joined', 'avatar', 'staff_profile'
        ]
        read_only_fields = ['id', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class StaffCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    employee_id = serializers.CharField(write_only=True, required=False, default='')
    department = serializers.CharField(write_only=True, required=False, default='Operations')
    address = serializers.CharField(write_only=True, required=False, default='', allow_blank=True)
    notes = serializers.CharField(write_only=True, required=False, default='', allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'password', 'first_name', 'last_name',
            'role', 'phone', 'is_active', 'employee_id', 'department', 'address', 'notes'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        employee_id = validated_data.pop('employee_id', None)
        department = validated_data.pop('department', 'Operations')
        address = validated_data.pop('address', '')
        notes = validated_data.pop('notes', '')

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        if not employee_id:
            employee_id = f"EMP-{user.id:04d}"

        StaffProfile.objects.create(
            user=user,
            employee_id=employee_id,
            department=department,
            address=address,
            notes=notes
        )
        return user


class StaffUpdateSerializer(serializers.ModelSerializer):
    department = serializers.CharField(required=False, write_only=True)
    address = serializers.CharField(required=False, write_only=True, allow_blank=True)
    notes = serializers.CharField(required=False, write_only=True, allow_blank=True)
    password = serializers.CharField(required=False, write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role',
            'phone', 'is_active', 'department', 'address', 'notes', 'password'
        ]

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        department = validated_data.pop('department', None)
        address = validated_data.pop('address', None)
        notes = validated_data.pop('notes', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        # Update profile
        profile, _ = StaffProfile.objects.get_or_create(
            user=instance,
            defaults={'employee_id': f"EMP-{instance.id:04d}"}
        )
        if department is not None:
            profile.department = department
        if address is not None:
            profile.address = address
        if notes is not None:
            profile.notes = notes
        profile.save()

        return instance
