# backend/reservations/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# DefaultRouterを初期化
router = DefaultRouter()

# --- ViewSetの登録 ---
# これで、各ViewSetに対応するURLセットが自動生成されます
router.register(r'salons', views.SalonViewSet, basename='salon')
router.register(r'services', views.ServiceViewSet, basename='service')
router.register(r'reservations', views.ReservationViewSet, basename='reservation')
router.register(r'admin/users', views.AdminUserManagementViewSet, basename='admin-user')
router.register(r'admin/reservations', views.AdminReservationViewSet, basename='admin-reservation')
router.register(r'admin/customers', views.AdminCustomerViewSet, basename='admin-customer')
""" print("--- DRF Router Registered URLs ---")
for url in router.urls:
    print(url)
print("---------------------------------")
 """
# --- urlpatternsの定義 ---
# ViewSetでは管理できない、個別のURLを持つAPIをここに定義します
urlpatterns = [
    # ViewSetによって自動生成されたURLをすべてインクルード
    path('', include(router.urls)),

    # 以下は、ViewSetではないAPIViewや関数ベースビューのパスです
    path('admin/customers/<int:pk>/send-message/', views.AdminCustomerViewSet.as_view({'post': 'send_message'}), name='admin-customer-send-message'),
    path('config/notifications/', views.NotificationSettingAPIView.as_view(), name='notification-setting'),
    path('availability/', views.AvailabilityCheckAPIView.as_view(), name='availability-check'),
    path('health-check/', views.HealthCheckAPIView.as_view(), name='health-check'),
    path('statistics/', views.StatisticsView.as_view(), name='statistics'),
    path('admin/time-slots/', views.TimeSlotAPIView.as_view(), name='admin-time-slots'),
    path('admin/available-slots/', views.AdminAvailableSlotView.as_view(), name='admin-available-slots'),
    path('admin/available-times-for-reservation/', views.AdminAvailableTimesForReservationView.as_view(), name='admin-available-times-for-reservation'),
    path('admin/detailed-time-slots/', views.AdminDetailedTimeSlotsView.as_view(), name='admin-detailed-time-slots'),
    path('admin/configured-dates/', views.ConfiguredDatesView.as_view(), name='admin-configured-dates'),
    path('bookable-dates/', views.BookableDatesView.as_view(), name='bookable-dates'),
    path('me/', views.me, name='me'),
    path('admin/me/', views.admin_me, name='admin-me'),
    path('line/callback/', views.LineLoginCallbackView.as_view(), name='line-callback'),
    path('line/webhook/', views.LineWebhookView.as_view(), name='line-webhook'),
    path('admin/line/link/', views.AdminLineLinkView.as_view(), name='admin-line-link'),
    path('admin/link-line/', views.AdminLineLinkView.as_view(), name='admin-link-line'),
    path('admin/login-line/', views.AdminLineLoginView.as_view(), name='admin-login-line'),
    path('admin/line-history/', views.LineMessageHistoryView.as_view(), name='admin-line-history'),
    path('admin/send-bulk-message/', views.send_bulk_message, name='admin-send-bulk-message'),
    path('confirm-reservation-and-notify/', views.confirm_reservation_and_notify, name='confirm-reservation-and-notify'),
    
]