# MomoNail/backend/momonail_backend_project/urls.py

from django.contrib import admin
from django.urls import path, include # include を追加
from django.conf.urls.i18n import i18n_patterns
from reservations.views import AdminAvailableSlotView, HealthCheckAPIView, MonthlyScheduleAdminView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('admin-api/available-slots/', AdminAvailableSlotView.as_view(), name='admin-available-slots'),
    path('admin-api/monthly-schedules/', MonthlyScheduleAdminView.as_view(), name='admin-monthly-schedules'),
    path('health/', HealthCheckAPIView.as_view(), name='health_check'),
]

# 国際化が必要なURL
urlpatterns += i18n_patterns(
    path('api/', include('reservations.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    prefix_default_language=False,
)