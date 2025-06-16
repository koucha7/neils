# reservations/urls.py の修正案
from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from .views import (
    SalonViewSet,
    ServiceViewSet,
    StatisticsView,
    ReservationViewSet,
    WeeklyDefaultScheduleViewSet,
    DateScheduleViewSet,
    AvailabilityCheckAPIView,
    MonthlyAvailabilityCheckAPIView,
    NotificationSettingAPIView,
    HealthCheckAPIView,
    TimeSlotAPIView,
    MonthlyScheduleAdminView
    )
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# 各APIエンドポイントをルーターに登録 (ViewSetを継承しているもののみ)
router = DefaultRouter()
router.register(r'salons', SalonViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'weekly-schedules', WeeklyDefaultScheduleViewSet)
router.register(r'date-schedules', DateScheduleViewSet)
# NotificationSettingAPIViewはAPIViewなので、ルーターには登録しない

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('reservations.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('availability/', AvailabilityCheckAPIView.as_view(), name='availability-check'), # AvailabilityCheckAPIViewのパス
    path('health/', HealthCheckAPIView.as_view(), name='health_check'),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('monthly-availability/', MonthlyAvailabilityCheckAPIView.as_view(), name='monthly-availability-check'), # ★この行を追加★
    path('notification-settings/', NotificationSettingAPIView.as_view(), name='notification-settings'), # NotificationSettingAPIViewのパス
    path('time-slots/', TimeSlotAPIView.as_view(), name='time-slots'), # この行を追加
    path('admin/monthly-schedules/', MonthlyScheduleAdminView.as_view(), name='admin-monthly-schedules'),
]

urlpatterns += router.urls # ルーターで登録されたViewSetのURLを追加