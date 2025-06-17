# backend/momonail_backend_project/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from reservations.views import AdminAvailableSlotView, MonthlyScheduleAdminView, HealthCheckAPIView

# --- 国際化しないURL ---
urlpatterns = [
    path('admin/', admin.site.urls),
    path('admin-api/available-slots/', AdminAvailableSlotView.as_view(), name='admin-available-slots'),
    path('admin-api/monthly-schedules/', MonthlyScheduleAdminView.as_view(), name='admin-monthly-schedules'),
    path('api/health/', HealthCheckAPIView.as_view(), name='health_check'),
]

# --- 国際化が必要なURL ---
urlpatterns += i18n_patterns(
    # ★★★ 具体的なパスを先に記述 ★★★
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ★★★ 汎用的な 'api/' を後に記述 ★★★
    path('api/', include('reservations.urls')),

    prefix_default_language=False,
)