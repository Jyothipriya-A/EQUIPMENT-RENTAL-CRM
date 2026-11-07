from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, LedgerEntryViewSet, SecurityDepositViewSet, InvoiceViewSet

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'ledger', LedgerEntryViewSet, basename='ledger')
router.register(r'deposits', SecurityDepositViewSet, basename='deposit')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
]
