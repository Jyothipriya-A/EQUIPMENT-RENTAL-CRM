"""
URL configuration for rental_crm project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.authentication.views import SystemSettingsView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Endpoints
    path('api/auth/', include('apps.authentication.urls')),
    path('api/', include('apps.inventory.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/rentals/', include('apps.rentals.urls')),
    path('api/', include('apps.billing.urls')),
    path('api/maintenance/', include('apps.maintenance.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/settings/', SystemSettingsView.as_view(), name='system-settings'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
