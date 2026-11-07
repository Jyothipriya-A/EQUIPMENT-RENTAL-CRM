from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, SupplierViewSet, ProductViewSet, AssetViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'assets', AssetViewSet, basename='asset')

urlpatterns = [
    path('', include(router.urls)),
]
