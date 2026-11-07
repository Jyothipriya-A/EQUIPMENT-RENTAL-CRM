from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Category, Supplier, Product, Asset
from .serializers import (
    CategorySerializer,
    SupplierSerializer,
    ProductSerializer,
    AssetSerializer
)
from apps.authentication.permissions import IsAdminUserRole

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and (request.user.role == 'admin' or request.user.is_superuser)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(contact_person__icontains=search) |
                models.Q(phone_number__icontains=search) |
                models.Q(email__icontains=search)
            )
        return queryset


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category').order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category', None)
        category_slug = self.request.query_params.get('category_slug', None)
        status_param = self.request.query_params.get('status', None)
        search = self.request.query_params.get('search', None)
        ordering = self.request.query_params.get('ordering', None)

        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(product_code__icontains=search) |
                models.Q(brand__icontains=search) |
                models.Q(model__icontains=search) |
                models.Q(description__icontains=search)
            )
        if ordering:
            queryset = queryset.order_by(ordering)
        return queryset

    @action(detail=True, methods=['get'])
    def assets(self, request, pk=None):
        product = self.get_object()
        assets = product.assets.all().select_related('supplier')
        serializer = AssetSerializer(assets, many=True)
        return Response(serializer.data)


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all().select_related('product', 'supplier', 'product__category').order_by('product__name', 'serial_number')
    serializer_class = AssetSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product', None)
        status_param = self.request.query_params.get('status', None)
        condition_param = self.request.query_params.get('condition', None)
        search = self.request.query_params.get('search', None)

        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if status_param:
            queryset = queryset.filter(availability_status=status_param)
        if condition_param:
            queryset = queryset.filter(current_condition=condition_param)
        if search:
            queryset = queryset.filter(
                models.Q(serial_number__icontains=search) |
                models.Q(asset_id__icontains=search) |
                models.Q(product__name__icontains=search) |
                models.Q(location__icontains=search)
            )
        return queryset

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        asset = self.get_object()
        rental_items = asset.rental_items.select_related('rental', 'rental__customer').order_by('-rental__rental_start_date')[:10]
        maintenance_items = asset.maintenance_records.select_related('assigned_staff').order_by('-start_date')[:10]
        
        rentals_data = [{
            'rental_id': item.rental.rental_id,
            'customer_name': item.rental.customer.full_name,
            'start_date': item.rental.rental_start_date,
            'expected_return_date': item.rental.expected_return_date,
            'status': item.rental.rental_status,
            'condition_on_dispatch': item.condition_on_dispatch,
            'condition_on_return': item.condition_on_return,
        } for item in rental_items]

        maintenance_data = [{
            'maintenance_id': m.maintenance_id,
            'type': m.maintenance_type,
            'issue': m.issue_description,
            'start_date': m.start_date,
            'completion_date': m.actual_completion_date,
            'cost': m.maintenance_cost,
            'status': m.status,
            'staff': m.assigned_staff.get_full_name() if m.assigned_staff else 'Unassigned'
        } for m in maintenance_items]

        return Response({
            'asset': AssetSerializer(asset).data,
            'rental_history': rentals_data,
            'maintenance_history': maintenance_data
        })
