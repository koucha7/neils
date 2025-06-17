# backend/reservations/urls.py （最終形）

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalonViewSet, ServiceViewSet # salonだけをインポート
""" from .views import (
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
    # ↓↓↓ 管理用ビューのインポートを追加 ↓↓↓
    AdminAvailableSlotView, 
    MonthlyScheduleAdminView
) """

router = DefaultRouter()
router.register(r'salons', SalonViewSet, basename='salon')
router.register(r'services', ServiceViewSet, basename='service')
""" router.register(r'services', ServiceViewSet, basename='service')
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'weekly-schedules', WeeklyDefaultScheduleViewSet, basename='weeklyschedule')
router.register(r'date-schedules', DateScheduleViewSet, basename='dateschedule')
 """
urlpatterns = router.urls

""" urlpatterns += [
    path('availability/', AvailabilityCheckAPIView.as_view(), name='availability-check'),
    path('monthly-availability/', MonthlyAvailabilityCheckAPIView.as_view(), name='monthly-availability-check'),
    path('notification-settings/', NotificationSettingAPIView.as_view(), name='notification-settings'),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('time-slots/', TimeSlotAPIView.as_view(), name='time-slots'),

    # ↓↓↓↓ 管理用のAPIパスをこちらに集約します ↓↓↓↓
    path('admin/available-slots/', AdminAvailableSlotView.as_view(), name='admin-available-slots'),
    path('admin/monthly-schedules/', MonthlyScheduleAdminView.as_view(), name='admin-monthly-schedules'),
] """