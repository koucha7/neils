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
    MonthlyScheduleAdminView,
    AdminAvailableSlotView
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
    path('', include(router.urls)), # ルーターで登録したURL (/salons, /services など)
    
    # APIViewを継承したクラスのパス
    path('availability/', AvailabilityCheckAPIView.as_view(), name='availability-check'),
    path('monthly-availability/', MonthlyAvailabilityCheckAPIView.as_view(), name='monthly-availability-check'),
    path('notification-settings/', NotificationSettingAPIView.as_view(), name='notification-settings'),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('admin/monthly-schedules/', MonthlyScheduleAdminView.as_view(), name='admin-monthly-schedules'),
    path('time-slots/', TimeSlotAPIView.as_view(), name='time-slots'),
    
    # ヘルスチェック用のパス
    path('health/', HealthCheckAPIView.as_view(), name='health_check'),
    path('admin/', admin.site.urls),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('api/', include('reservations.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

urlpatterns += router.urls # ルーターで登録されたViewSetのURLを追加