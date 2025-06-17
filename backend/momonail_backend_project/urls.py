# backend/momonail_backend_project/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# ↓↓↓ インポートするビューに SalonViewSet を追加します ↓↓↓
from reservations.views import AdminAvailableSlotView, MonthlyScheduleAdminView, HealthCheckAPIView, SalonViewSet

# --- 国際化しないURL ---
urlpatterns = [
    path('admin/', admin.site.urls),
    path('admin-api/available-slots/', AdminAvailableSlotView.as_view(), name='admin-available-slots'),
    path('admin-api/monthly-schedules/', MonthlyScheduleAdminView.as_view(), name='admin-monthly-schedules'),
    path('api/health/', HealthCheckAPIView.as_view(), name='health_check'),
    # path('debug-show-urls/', debug_urls_view, name='debug-show-urls'), # ← 不要なので削除
]

# --- 国際化が必要なURL ---
urlpatterns += i18n_patterns(
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ↓↓↓↓ 問題切り分けのため、テスト用のパスを一時的に追加します ↓↓↓↓
    path('api/salons/', SalonViewSet.as_view({'get': 'list'}), name='salon-list-test'),

    # 既存のincludeも残しておきます
    path('api/', include('reservations.urls')),

    prefix_default_language=False,
)