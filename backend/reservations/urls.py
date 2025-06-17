from django.urls import path, include
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
router.register(r'salons', SalonViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'weekly-schedules', WeeklyDefaultScheduleViewSet)
router.register(r'date-schedules', DateScheduleViewSet)

# このファイルには、reservationsアプリに直接関連するURLのみを記述します
urlpatterns = [
    path('', include(router.urls)),
    path('availability/', AvailabilityCheckAPIView.as_view(), name='availability-check'),
    path('monthly-availability/', MonthlyAvailabilityCheckAPIView.as_view(), name='monthly-availability-check'),
    path('notification-settings/', NotificationSettingAPIView.as_view(), name='notification-settings'),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('time-slots/', TimeSlotAPIView.as_view(), name='time-slots'),
]