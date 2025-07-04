# backend/reservations/urls.py

from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

# 1. ViewSetを使って基本的なCRUDのURLを自動生成
router = DefaultRouter()
router.register(r'salons', views.SalonViewSet, basename='salon')
router.register(r'services', views.ServiceViewSet, basename='service') # This handles /services/ and /services/<pk>/
router.register(r'reservations', views.ReservationViewSet, basename='reservation') # This handles /reservations/ etc.
router.register(r'weekly-schedules', views.WeeklyDefaultScheduleViewSet, basename='weeklyschedule')
router.register(r'date-schedules', views.DateScheduleViewSet, basename='dateschedule')


# 2. ViewSetでカバーされない、特別なURLを手動で定義
urlpatterns = [
    # --- Router-generated URLs are included first ---
    *router.urls,

    # --- Custom API endpoints ---
    path('availability/', views.AvailabilityCheckAPIView.as_view(), name='availability-check'),
    path('notification-settings/', views.NotificationSettingAPIView.as_view(), name='notification-settings'),
    path('statistics/', views.StatisticsView.as_view(), name='statistics'),
    path('time-slots/', views.TimeSlotAPIView.as_view(), name='time-slots'),
    path('bookable-dates/', views.BookableDatesView.as_view(), name='bookable-dates'),
    path('users/me/', views.me, name='me'),
    path('my-reservations/',views.MyReservationsView.as_view(), name='my_reservations'),
    path('line/webhook/', views.LineWebhookView.as_view(), name='line-webhook'),
 
    # --- Admin-specific endpoints ---
    path('admin/reservations/', views.AdminReservationListView.as_view(), name='admin-reservation-list'),
    path('admin/available-slots/', views.AdminAvailableSlotView.as_view(), name='admin-available-slots'),
    path('admin/configured-dates/', views.ConfiguredDatesView.as_view(), name='admin-configured-dates'),
    
    # --- LINE Login and related ---
    path('line/callback/', views.LineLoginCallbackView.as_view(), name='line-callback'),
    path('confirm-reservation-and-notify/', views.confirm_reservation_and_notify, name='confirm-reservation-and-notify'),
]