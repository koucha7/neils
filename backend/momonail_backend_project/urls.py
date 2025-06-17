# MomoNail/backend/momonail_backend_project/urls.py

from django.contrib import admin
from django.urls import path, include # include を追加
from django.conf.urls.i18n import i18n_patterns

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
]

# 国際化が必要なURL
urlpatterns += i18n_patterns(
    path('api/', include('reservations.urls')),
    # ログイン認証用のトークンを取得するAPI
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # アクセストークンを更新するためのAPI
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    prefix_default_language=False,
)