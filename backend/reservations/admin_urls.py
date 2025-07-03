from django.urls import path
from .views import AdminReservationListView

urlpatterns = [
    # 管理者用の予約リスト取得APIのURL
    path('reservations/', AdminReservationListView.as_view(), name='admin_reservation_list'),
]