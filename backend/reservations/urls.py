# MomoNail/backend/reservations/urls.py

from rest_framework.routers import DefaultRouter
from .views import SalonViewSet, ServiceViewSet, ReservationViewSet

router = DefaultRouter()
router.register(r'salons', SalonViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'reservations', ReservationViewSet)

urlpatterns = router.urls