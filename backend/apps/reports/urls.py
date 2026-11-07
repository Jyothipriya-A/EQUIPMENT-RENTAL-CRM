from django.urls import path
from .views import DashboardStatsView, RevenueReportView, ExportCSVView

urlpatterns = [
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('revenue/', RevenueReportView.as_view(), name='revenue-report'),
    path('export-csv/', ExportCSVView.as_view(), name='export-csv'),
]
