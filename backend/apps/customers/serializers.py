from rest_framework import serializers
from .models import Customer, CompanyContact

class CompanyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyContact
        fields = ['id', 'name', 'phone', 'email', 'designation', 'is_primary', 'created_at']

class CustomerSerializer(serializers.ModelSerializer):
    contacts = CompanyContactSerializer(many=True, required=False)
    total_rentals = serializers.ReadOnlyField(source='total_rentals_count')
    active_rentals = serializers.ReadOnlyField(source='active_rentals_count')
    outstanding_dues = serializers.ReadOnlyField(source='total_outstanding_dues')
    held_deposits = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()

    class Meta:
        model = Customer
        fields = [
            'id', 'customer_type', 'display_name', 'full_name', 'phone_number', 'email', 'address',
            'id_proof_type', 'id_proof_number', 'registration_date', 'notes', 'is_active',
            'company_name', 'company_type', 'gstin', 'company_email', 'billing_address',
            'po_number', 'credit_limit', 'credit_approved', 'payment_terms_days',
            'contacts', 'total_rentals', 'active_rentals', 'outstanding_dues', 'held_deposits',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        contacts_data = validated_data.pop('contacts', [])
        customer = Customer.objects.create(**validated_data)
        for contact_data in contacts_data:
            CompanyContact.objects.create(customer=customer, **contact_data)
        return customer

    def update(self, instance, validated_data):
        contacts_data = validated_data.pop('contacts', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if contacts_data is not None:
            instance.contacts.all().delete()
            for contact_data in contacts_data:
                CompanyContact.objects.create(customer=instance, **contact_data)
        return instance
