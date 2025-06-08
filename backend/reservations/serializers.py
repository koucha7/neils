# MomoNail/backend/reservations/serializers.py

from rest_framework import serializers
from .models import Salon, Service, Reservation

class SalonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salon
        fields = '__all__' # 全てのフィールドをAPIで扱う

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class ReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ('reservation_number', 'created_at', 'status', 'end_time') # 予約番号などは自動生成

class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ['customer_name', 'customer_phone', 'customer_email', 'salon', 'service', 'start_time']