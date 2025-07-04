from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminReservationListView, 
    AdminUserManagementViewSet,
    AdminLineLinkView,
    AdminLineLoginView
)

# ViewSet用のルーターを定義
router = DefaultRouter()
# /api/admin/users/ というパスで AdminUserManagementViewSet を利用可能にする
router.register(r'users', AdminUserManagementViewSet, basename='admin-user')

urlpatterns = [
    # ルーターが生成したURL（/api/admin/users/ など）をインクルード
    path('', include(router.urls)),
    
    # 管理者用の予約リスト取得APIのURL
    path('reservations/', AdminReservationListView.as_view(), name='admin_reservation_list'),
    # 管理者アカウントとLINEを連携させるためのURL
    path('link-line/', AdminLineLinkView.as_view(), name='admin-link-line'),
    # 連携済みのLINEアカウントでログインするためのURL
    path('login-line/', AdminLineLoginView.as_view(), name='admin-login-line'),
]