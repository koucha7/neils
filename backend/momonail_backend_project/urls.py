from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from reservations.views import HealthCheckAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', HealthCheckAPIView.as_view(), name='health_check'),
]

urlpatterns += i18n_patterns(
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # ★★★ この行を元に戻します ★★★
    path('api/', include('reservations.urls')),
    prefix_default_language=False,
)