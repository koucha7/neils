from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# ★ 1. 以下の3行を追加 ★

class HealthCheckAPIView(APIView):
    """
    Renderのヘルスチェック用API。認証不要。
    """
    permission_classes = [AllowAny]
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"}, status=200)

# --- URLパターンの定義 ---
urlpatterns = [
    # 1. Django標準の管理画面
    path('admin/', admin.site.urls),

    # 2. Render用のヘルスチェック
    path('api/health/', HealthCheckAPIView.as_view(), name='health_check'),

    # 3. 認証トークン取得用のAPI
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # 顧客向けAPIのエンドポイント
    path('api/', include('reservations.urls')),
]

urlpatterns += i18n_patterns()