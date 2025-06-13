# MomoNail/backend/momonail_backend_project/urls.py

from django.contrib import admin
from django.urls import path, include # include を追加

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('reservations.urls')), # これを追加
    # ログイン認証用のトークンを取得するAPI
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # アクセストークンを更新するためのAPI
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]