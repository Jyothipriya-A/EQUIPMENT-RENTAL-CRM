from rest_framework import serializers
from .models import Category, Supplier, Product, Asset

class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'products_count', 'created_at']

    def get_products_count(self, obj):
        return obj.products.count()


class SupplierSerializer(serializers.ModelSerializer):
    supplied_assets_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'contact_person', 'phone_number', 'email',
            'address', 'company_details', 'notes', 'supplied_assets_count',
            'created_at', 'updated_at'
        ]

    def get_supplied_assets_count(self, obj):
        return obj.supplied_assets.count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    total_assets = serializers.ReadOnlyField(source='total_assets_count')
    available_assets = serializers.ReadOnlyField(source='available_assets_count')
    rented_assets = serializers.ReadOnlyField(source='rented_assets_count')

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'product_code', 'category', 'category_name',
            'description', 'brand', 'model', 'image_url',
            'daily_rental_rate', 'weekly_rental_rate', 'monthly_rental_rate',
            'security_deposit', 'replacement_value', 'late_fee_per_day', 'default_rental_duration',
            'status', 'total_assets', 'available_assets', 'rented_assets',
            'created_at', 'updated_at'
        ]


class AssetSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_code = serializers.ReadOnlyField(source='product.product_code')
    product_category = serializers.ReadOnlyField(source='product.category.name')
    supplier_name = serializers.ReadOnlyField(source='supplier.name')
    daily_rental_rate = serializers.ReadOnlyField(source='product.daily_rental_rate')
    security_deposit = serializers.ReadOnlyField(source='product.security_deposit')

    class Meta:
        model = Asset
        fields = [
            'id', 'asset_id', 'product', 'product_name', 'product_code', 'product_category',
            'serial_number', 'supplier', 'supplier_name', 'purchase_date',
            'purchase_cost', 'current_condition', 'availability_status',
            'location', 'notes', 'daily_rental_rate', 'security_deposit',
            'created_at', 'updated_at'
        ]
