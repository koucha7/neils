# backend/reservations/urls.py

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
    NotificationSettingAPIView,  # Older view name was NotificationSettingAPIView
    StatisticsView,
    TimeSlotAPIView,
    AdminAvailableSlotView, # Older view name was AdminAvailableSlotView
    ConfiguredDatesView,
    BookableDatesView,
    LineLoginCallbackView, # Older view name was LineLoginCallbackView
    MonthlyScheduleAdminView,
    MyReservationsView, # Older view name was MyReservationsView
    AdminReservationListView,
    me,
)

# 1. ViewSetを使って基本的なCRUDのURLを自動生成
router = DefaultRouter()
router.register(r'salons', SalonViewSet, basename='salon')
router.register(r'services', ServiceViewSet, basename='service') # This handles /services/ and /services/<pk>/
router.register(r'reservations', ReservationViewSet, basename='reservation') # This handles /reservations/ etc.
router.register(r'weekly-schedules', WeeklyDefaultScheduleViewSet, basename='weeklyschedule')
router.register(r'date-schedules', DateScheduleViewSet, basename='dateschedule')


# 2. ViewSetでカバーされない、特別なURLを手動で定義
urlpatterns = [
    # --- Router-generated URLs are included first ---
    *router.urls,

    # --- Custom API endpoints ---
    path('availability/', AvailabilityCheckAPIView.as_view(), name='availability-check'),
    path('monthly-availability/', MonthlyAvailabilityCheckAPIView.as_view(), name='monthly-availability-check'),
    path('notification-settings/', NotificationSettingAPIView.as_view(), name='notification-settings'),
    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('time-slots/', TimeSlotAPIView.as_view(), name='time-slots'),
    path('bookable-dates/', BookableDatesView.as_view(), name='bookable-dates'),
    path('users/me/', me, name='me'),
    path('my-reservations/', MyReservationsView.as_view(), name='my_reservations'),
 
    # --- Admin-specific endpoints ---
    path('admin/reservations/', AdminReservationListView.as_view(), name='admin-reservation-list'),
    path('admin/available-slots/', AdminAvailableSlotView.as_view(), name='admin-available-slots'),
    path('admin/monthly-schedules/', MonthlyScheduleAdminView.as_view(), name='admin-monthly-schedules'),
    path('admin/configured-dates/', ConfiguredDatesView.as_view(), name='admin-configured-dates'),
    
    # --- LINE Login and related ---
    path('line/callback/', LineLoginCallbackView.as_view(), name='line-callback'),
 ]