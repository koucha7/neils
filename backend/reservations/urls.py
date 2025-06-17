# backend/reservations/urls.py

from django.urls import path
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
    TimeSlotAPIView,
)

router = DefaultRouter()
router.register(r'salons', SalonViewSet, basename='salon')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'weekly-schedules', WeeklyDefaultScheduleViewSet, basename='weeklyschedule')
router.register(r'date-schedules', DateScheduleViewSet, basename='dateschedule')

# ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
# ★★★ ここからが重要な修正点です ★★★
# ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

# ルーターが生成したURLリストを urlpatterns に直接代入します
urlpatterns = router.urls

# APIViewを継承したクラスのパスを、urlpatterns に追加していきます
urlpatterns += [
    path('availability/', AvailabilityCheckAPIView.as_view(), name='availability-check'),
    path('monthly-availability/', MonthlyAvailabilityCheckAPIView.as_view(), name='monthly-availability-check'),
    path('notification-settings/', NotificationSettingAPIView.as_view(), name='notification-settings'),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('time-slots/', TimeSlotAPIView.as_view(), name='time-slots'),
]