# reservations/urls.py の修正案
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    SalonViewSet,
    ServiceViewSet,
    ReservationViewSet,
    WeeklyDefaultScheduleViewSet,
    DateScheduleViewSet,
    AvailabilityCheckAPIView,
    MonthlyAvailabilityCheckAPIView,
    NotificationSettingAPIView
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
    path('availability/', AvailabilityCheckAPIView.as_view(), name='availability-check'), # AvailabilityCheckAPIViewのパス
    path('monthly-availability/', MonthlyAvailabilityCheckAPIView.as_view(), name='monthly-availability-check'), # ★この行を追加★
    path('notification-settings/', NotificationSettingAPIView.as_view(), name='notification-settings'), # NotificationSettingAPIViewのパス
]

urlpatterns += router.urls # ルーターで登録されたViewSetのURLを追加