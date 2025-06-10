from rest_framework import serializers
from .models import (
    Salon, 
    Service, 
    Reservation, 
    DateSchedule, 
    WeeklyDefaultSchedule, 
    NotificationSetting
)

class SalonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salon
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class WeeklyDefaultScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyDefaultSchedule
        fields = '__all__'

class DateScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DateSchedule
        fields = '__all__'

class ReservationSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ('reservation_number', 'created_at', 'status', 'end_time')

class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ['customer_name', 'customer_phone', 'customer_email', 'salon', 'service', 'start_time']

class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = '__all__'