from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RentalViewSet, AvailabilityCheckView

router = DefaultRouter()
router.register(r'', RentalViewSet, basename='rental')

urlpatterns = [
    path('availability/', AvailabilityCheckView.as_view(), name='rental-availability'),
    path('', include(router.urls)),
]
