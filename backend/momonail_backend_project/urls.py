# backend/momonail_backend_project/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# HealthCheckAPIViewのみをインポートします
from reservations.views import HealthCheckAPIView 

def test_view(request):
    return HttpResponse("Test URL is working!", status=200)

urlpatterns = [
    path('test-url/', test_view, name='test_view'),
    path('admin/', admin.site.urls),
    # admin-api/ のパスは廃止し、reservations.urls に統合します
    # path('admin-api/available-slots/', AdminAvailableSlotView.as_view(), name='admin-available-slots'),
    # path('admin-api/monthly-schedules/', MonthlyScheduleAdminView.as_view(), name='admin-monthly-schedules'),
    path('api/health/', HealthCheckAPIView.as_view(), name='health_check'),
]

urlpatterns += i18n_patterns(
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('reservations.urls')), # ← ここですべてのAPIが処理されます
    
    prefix_default_language=False,
)