from .models import Service, Reservation, WeeklyDefaultSchedule, DateSchedule, NotificationSetting
from .serializers import NotificationSettingSerializer
from datetime import datetime, time, timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q # ★追加: Qオブジェクトをインポート
from django.utils import timezone
from google.auth.exceptions import GoogleAuthError
from google.oauth2 import service_account
from googleapiclient.discovery import build
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
import os
import requests
import uuid

from .models import (
    DateSchedule,
    NotificationSetting,
    Reservation,
    Salon,
    Service,
    WeeklyDefaultSchedule,
)
from .notifications import send_line_notification
from .serializers import (
    DateScheduleSerializer,
    NotificationSettingSerializer,
    ReservationCreateSerializer,
    ReservationSerializer,
    SalonSerializer,
    ServiceSerializer,
    WeeklyDefaultScheduleSerializer,
)


class SalonViewSet(viewsets.ModelViewSet):
    queryset = Salon.objects.all()
    serializer_class = SalonSerializer
    permission_classes = [AllowAny] # ★追加


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny] # ★追加


class WeeklyDefaultScheduleViewSet(viewsets.ModelViewSet):
    queryset = WeeklyDefaultSchedule.objects.all()
    serializer_class = WeeklyDefaultScheduleSerializer
    permission_classes = [AllowAny] # ★追加


class DateScheduleViewSet(viewsets.ModelViewSet):
    queryset = DateSchedule.objects.all()
    serializer_class = DateScheduleSerializer
    permission_classes = [AllowAny] # ★追加

    def _has_existing_reservations(self, date):
        return Reservation.objects.filter(
            start_time__date=date, status__in=["pending", "confirmed"]
        ).exists()

    def create(self, request, *args, **kwargs):
        date_str = request.data.get("date")
        if date_str:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            if self._has_existing_reservations(target_date):
                return Response(
                    {
                        "error": "この日付には既に予約が存在するため、休業日や営業時間の変更はできません。"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        date_str = request.data.get("date")
        if date_str:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            if self._has_existing_reservations(target_date):
                return Response(
                    {
                        "error": "この日付には既に予約が存在するため、休業日や営業時間の変更はできません。"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return super().update(request, *args, **kwargs)


class ReservationViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny] # ★追加
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    lookup_field = "reservation_number"

    def get_serializer_class(self):
        if self.action == "create":
            return ReservationCreateSerializer
        return ReservationSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset() # デフォルトのクエリセットを取得
        
        # ★修正: date ではなく start_date と end_date を取得★
        start_date_str = self.request.query_params.get('start_date')
        end_date_str = self.request.query_params.get('end_date')
        statuses = self.request.query_params.getlist('status') 

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(start_time__date__gte=start_date) # 指定日以降
            except ValueError:
                pass # 無効な日付形式は無視

        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
                queryset = queryset.filter(start_time__date__lte=end_date) # 指定日以前
            except ValueError:
                pass # 無効な日付形式は無視
        
        # ★追加: ステータスフィルタリング
        if statuses:
            # Qオブジェクトを使ってOR条件でフィルタリング
            status_query = Q()
            for status_val in statuses:
                status_query |= Q(status=status_val)
            queryset = queryset.filter(status_query)
                
        return queryset.order_by('-start_time') # 予約日時でソート

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = serializer.validated_data["service"]
        start_time = serializer.validated_data["start_time"]
        end_time = start_time + timedelta(minutes=service.duration_minutes)

        reservation = serializer.save(
            reservation_number=str(uuid.uuid4()).replace("-", "")[:10].upper(),
            end_time=end_time,
            status="pending",
        )

        try:
            message = (
                f"新しい予約が入りました！\n\n"
                f"予約番号: {reservation.reservation_number}\n"
                f"お名前: {reservation.customer_name}様\n"
                f"日時: {reservation.start_time.strftime('%Y-%m-%d %H:%M')}\n"
                f"サービス: {reservation.service.name}\n\n"
                f"▼予約詳細・確定はこちら\n"
                f"https://momonail-frontend.onrender.com/admin/reservations/{reservation.reservation_number}"
            )
            send_line_notification(message)
        except Exception as e:
            print(f"LINE notification failed: {e}")

        try:
            subject = f"【MomoNail】ご予約ありがとうございます（お申込内容の確認）"
            message = (
                f"{reservation.customer_name}様\n\n"
                f"この度は、MomoNailにご予約いただき、誠にありがとうございます。\n"
                f"以下の内容でご予約を承りました。ネイリストが内容を確認後、改めて「予約確定メール」をお送りしますので、今しばらくお待ちください。\n\n"
                f"--- ご予約内容 ---\n"
                f"予約番号: {reservation.reservation_number}\n"
                f"日時: {reservation.start_time.strftime('%Y年%m月%d日 %H:%M')}\n"
                f"サービス: {reservation.service.name}\n"
                f"------------------\n\n"
                f"ご予約内容の確認・キャンセルは、以下のページからも行えます。\n"
                f"https://momonail-frontend.onrender.com/check\n\n"
                f"MomoNail"
            )
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@momonail.com")
            recipient_list = [reservation.customer_email]
            send_mail(subject, message, from_email, recipient_list)
        except Exception as e:
            print(f"Failed to send reservation received email: {e}")

        headers = self.get_success_headers(serializer.data)
        return Response(
            ReservationSerializer(reservation).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, reservation_number=None):
        """
        予約を確定済みに更新し、各種通知を送信するカスタムアクション
        """
        reservation = self.get_object()
        
        if reservation.status != 'pending':
            return Response(
                {'error': 'この予約は保留中でないため、確定できません。'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # ステータスを更新して保存
        reservation.status = 'confirmed'
        reservation.save()
        
        # --- ここから通知処理 ---

        # 1. 予約確定メールをお客様に送信
        try:
            subject = f"【MomoNail】ご予約が確定いたしました"
            message = (
                f"{reservation.customer_name}様\n\n"
                f"お申し込みいただいた以下の内容で、ご予約が確定いたしました。\n"
                f"ご来店を心よりお待ちしております。\n\n"
                f"--- ご予約内容 ---\n"
                f"予約番号: {reservation.reservation_number}\n"
                f"日時: {reservation.start_time.strftime('%Y年%m月%d日 %H:%M')}\n"
                f"サービス: {reservation.service.name}\n"
                # ★★★ ここから追加 ★★★
                f"ご予約内容の確認・キャンセルは、以下のページからも行えます。\n"
                f"https://momonail-frontend.onrender.com/check\n\n"
                # ★★★ ここまで追加 ★★★
                f"MomoNail"
            )
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@momonail.com")
            recipient_list = [reservation.customer_email]
            send_mail(subject, message, from_email, recipient_list)
        except Exception as e:
            print(f"Failed to send reservation confirmed email: {e}")
            
        # 2. Googleカレンダーにイベントを追加
        try:
            self.add_event_to_google_calendar(reservation)
        except Exception as e:
            print(f"Google Calendar event creation failed after confirmation: {e}")

        return Response({'status': 'reservation confirmed'})

    @action(detail=True, methods=["post"])
    def cancel(self, request, reservation_number=None):
        reservation = self.get_object()
        if reservation.status in ["completed", "cancelled"]:
            return Response(
                {"error": "この予約は完了またはキャンセル済みのため、変更できません。"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        reservation.status = "cancelled"
        reservation.save()
        return Response({"status": "reservation cancelled"})
    
    def add_event_to_google_calendar(self, reservation):
        SCOPES = ['https://www.googleapis.com/auth/calendar']
        SERVICE_ACCOUNT_FILE = 'google_credentials.json'
        CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID')

        if not CALENDAR_ID:
            print("Google Calendar ID not set.")
            return

        try:
            creds = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        except (FileNotFoundError, GoogleAuthError) as e:
            print(f"Could not load Google credentials: {e}")
            return
            
        service = build('calendar', 'v3', credentials=creds)
        event = {
            'summary': f"【予約】{reservation.customer_name}様",
            'description': (
                f"サービス: {reservation.service.name}\n"
                f"予約番号: {reservation.reservation_number}\n"
                f"連絡先: {reservation.customer_email or 'N/A'}"
            ),
            'start': {
                'dateTime': reservation.start_time.isoformat(),
                'timeZone': 'Asia/Tokyo',
            },
            'end': {
                'dateTime': reservation.end_time.isoformat(),
                'timeZone': 'Asia/Tokyo',
            },
        }
        created_event = service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
        print(f"Event created: {created_event.get('htmlLink')}")
    
class NotificationSettingAPIView(APIView):
    """
    通知設定を取得・更新するAPI
    """
    def get(self, request, *args, **kwargs):
        # 設定は1つしかないので、最初の1件を取得または作成する
        setting, created = NotificationSetting.objects.get_or_create(pk=1)
        serializer = NotificationSettingSerializer(setting)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        setting, created = NotificationSetting.objects.get_or_create(pk=1)
        serializer = NotificationSettingSerializer(setting, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AvailabilityCheckAPIView(APIView):
    permission_classes = [AllowAny] # ★追加
    def get(self, request, *args, **kwargs):
        date_str = request.query_params.get('date')
        service_id = request.query_params.get('service_id')

        if not date_str or not service_id:
            return Response({"error": "日付とサービスIDが必要です。"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            service = Service.objects.get(id=service_id)
        except (ValueError, Service.DoesNotExist):
            return Response({"error": "無効な日付またはサービスIDです。"}, status=status.HTTP_400_BAD_REQUEST)

        opening_time, closing_time = None, None
        date_schedule = DateSchedule.objects.filter(date=target_date).first()

        if date_schedule:
            if date_schedule.is_closed: return Response([])
            opening_time, closing_time = date_schedule.opening_time, date_schedule.closing_time
        else:
            weekday = target_date.weekday()
            default_schedule = WeeklyDefaultSchedule.objects.filter(day_of_week=weekday).first()
            if not default_schedule or default_schedule.is_closed: return Response([])
            opening_time, closing_time = default_schedule.opening_time, default_schedule.closing_time

        if not isinstance(opening_time, time) or not isinstance(closing_time, time):
            return Response([])

        existing_reservations = Reservation.objects.filter(
            start_time__date=target_date
        ).exclude(status="cancelled")

        available_slots = []
        slot_interval = timedelta(minutes=30)
        
        # ★★★ ここからが重要な修正 ★★★
        # 全ての時刻をタイムゾーン情報を持たない naive オブジェクトに統一する
        start_of_day_naive = datetime.combine(target_date, opening_time)
        end_of_day_naive = datetime.combine(target_date, closing_time)
        
        current_slot_naive = start_of_day_naive
        while (current_slot_naive + timedelta(minutes=service.duration_minutes)) <= end_of_day_naive:
            is_available = True
            
            potential_start = current_slot_naive
            potential_end = current_slot_naive + timedelta(minutes=service.duration_minutes)

            for r in existing_reservations:
                # データベースから取得した r.start_time も naive なので、これで比較できる
                if max(potential_start, r.start_time) < min(potential_end, r.end_time):
                    is_available = False
                    break
            
            if is_available:
                available_slots.append(potential_start.strftime("%H:%M"))
            
            current_slot_naive += slot_interval
        # ★★★ ここまでが重要な修正 ★★★

        return Response(available_slots, status=status.HTTP_200_OK)
    
#
class MonthlyAvailabilityCheckAPIView(APIView):
    permission_classes = [AllowAny] # ★追加
    def get(self, request, *args, **kwargs):
        year_str = request.query_params.get('year')
        month_str = request.query_params.get('month')
        service_id = request.query_params.get('service_id')

        if not all([year_str, month_str, service_id]):
            return Response({"error": "年、月、サービスIDが必要です。"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            year = int(year_str)
            month = int(month_str)
            service = Service.objects.get(id=service_id)
        except (ValueError, Service.DoesNotExist):
            return Response({"error": "無効なパラメータです。"}, status=status.HTTP_400_BAD_REQUEST)

        from calendar import monthrange
        num_days = monthrange(year, month)[1]

        daily_availability = {}

        weekly_schedules = {s.day_of_week: s for s in WeeklyDefaultSchedule.objects.all()}
        date_schedules = {s.date.isoformat(): s for s in DateSchedule.objects.filter(date__year=year, date__month=month)}
        reservations_for_month = Reservation.objects.filter(
            start_time__year=year, start_time__month=month
        ).exclude(status="cancelled")

        for day in range(1, num_days + 1):
            target_date = datetime(year, month, day).date()
            target_date_iso = target_date.isoformat()
            
            opening_time, closing_time = None, None
            is_closed_for_day = False

            if target_date_iso in date_schedules:
                day_schedule = date_schedules[target_date_iso]
                if day_schedule.is_closed:
                    is_closed_for_day = True
                else:
                    opening_time = day_schedule.opening_time
                    closing_time = day_schedule.closing_time
            else:
                weekday = target_date.weekday()
                if weekday in weekly_schedules:
                    day_schedule = weekly_schedules[weekday]
                    if day_schedule.is_closed:
                        is_closed_for_day = True
                    else:
                        opening_time = day_schedule.opening_time
                        closing_time = day_schedule.closing_time
                else:
                    is_closed_for_day = True
            
            if is_closed_for_day or not isinstance(opening_time, time) or not isinstance(closing_time, time):
                daily_availability[target_date_iso] = False
                continue

            open_dt = timezone.make_aware(datetime.combine(target_date, opening_time))
            close_dt = timezone.make_aware(datetime.combine(target_date, closing_time))
            total_business_minutes = (close_dt - open_dt).total_seconds() / 60

            reservations_for_day = [r for r in reservations_for_month if r.start_time.date() == target_date]
            total_reserved_minutes = sum(
                (r.end_time - r.start_time).total_seconds() / 60 for r in reservations_for_day
            )

            remaining_minutes = total_business_minutes - total_reserved_minutes
            if remaining_minutes >= service.duration_minutes:
                daily_availability[target_date_iso] = True
            else:
                daily_availability[target_date_iso] = False

        return Response(daily_availability, status=status.HTTP_200_OK)
    
class HealthCheckAPIView(APIView):
    """
    Renderのヘルスチェック用API。認証不要。
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)