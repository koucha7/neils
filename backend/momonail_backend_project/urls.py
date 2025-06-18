from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
# ★ 1. 以下の3行を追加 ★
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

class HealthCheckAPIView(APIView):
    """
    Renderのヘルスチェック用API。認証不要。
    """
    permission_classes = [AllowAny]
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"}, status=200)
    
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', HealthCheckAPIView.as_view(), name='health_check'), 
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('reservations.urls')),
]

urlpatterns += i18n_patterns()