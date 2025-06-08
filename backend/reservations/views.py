# MomoNail/backend/reservations/views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Salon, Service, Reservation
from .serializers import SalonSerializer, ServiceSerializer, ReservationSerializer, ReservationCreateSerializer
import uuid # 予約番号生成用

class SalonViewSet(viewsets.ModelViewSet):
    queryset = Salon.objects.all()
    serializer_class = SalonSerializer

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        return ReservationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 予約番号を生成
        reservation_number = str(uuid.uuid4()).replace('-', '')[:10].upper() # 例: 10桁のUUID
        # 終了時間を計算 (所要時間に応じて)
        service = serializer.validated_data['service']
        start_time = serializer.validated_data['start_time']
        end_time = start_time + timedelta(minutes=service.duration_minutes)

        # 予約の重複チェック (簡易版、より厳密なチェックが必要)
        # 同じサロン、同じ時間帯に他の予約がないかなど

        reservation = serializer.save(
            reservation_number=reservation_number,
            end_time=end_time,
            status='pending' # 初期ステータスをpendingに
        )

        headers = self.get_success_headers(serializer.data)
        return Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED, headers=headers)