# backend/reservations/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SalonViewSet,
    ServiceViewSet,
    ReservationViewSet,
    WeeklyDefaultScheduleViewSet,
    DateScheduleViewSet,
)

router = DefaultRouter()
router.register(r'salons', SalonViewSet, basename='salon')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'reservations', ReservationViewSet, basename='reservation')
router.register(r'weekly-schedules', WeeklyDefaultScheduleViewSet, basename='weeklyschedule')
router.register(r'date-schedules', DateScheduleViewSet, basename='dateschedule')

urlpatterns = [
    path('', include(router.urls)),
]