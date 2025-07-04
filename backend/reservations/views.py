import os
import uuid
import calendar
import requests
import hashlib
import hmac
import base64
import json
from .authentication import CustomerJWTAuthentication
from datetime import datetime, time, timedelta, date
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q, Sum, Count
from django.contrib.auth.models import User
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from google.auth.exceptions import GoogleAuthError
from google.oauth2 import service_account
from googleapiclient.discovery import build
from rest_framework import status, viewsets, generics
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser 
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv
from pathlib import Path
from rest_framework_simplejwt.authentication import JWTAuthentication
from .notifications import send_line_push_message, send_admin_line_notification
from .line_utils import get_line_user_profile
from rest_framework_simplejwt.tokens import RefreshToken

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

from .models import (
    DateSchedule,
    NotificationSetting,
    Reservation,
    Salon,
    Service,
    WeeklyDefaultSchedule,
    Customer,
    AvailableTimeSlot,
    UserProfile,
)

from .serializers import (
    DateScheduleSerializer,
    NotificationSettingSerializer,
    ReservationCreateSerializer,
    ReservationSerializer,
    SalonSerializer,
    ServiceSerializer,
    WeeklyDefaultScheduleSerializer,
    CustomerSerializer,
    UserSerializer,
    AdminUserSerializer,
)

class SalonViewSet(viewsets.ModelViewSet):
    queryset = Salon.objects.all()
    serializer_class = SalonSerializer
    authentication_classes = []
    permission_classes = [AllowAny]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

class WeeklyDefaultScheduleViewSet(viewsets.ModelViewSet):
    queryset = WeeklyDefaultSchedule.objects.all()
    serializer_class = WeeklyDefaultScheduleSerializer
    permission_classes = [IsAuthenticated]

class DateScheduleViewSet(viewsets.ModelViewSet):
    queryset = DateSchedule.objects.all()
    serializer_class = DateScheduleSerializer
    permission_classes = [IsAuthenticated]

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
    # ★ 1. このViewSetで使う認証方法を顧客専用のものに指定します
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]  # 認証済み顧客のみアクセスを許可

    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    lookup_field = "reservation_number"

    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        return ReservationSerializer

    def get_queryset(self):
        # ログインしている顧客自身の予約のみを返すように修正
        customer = self.request.user
        if isinstance(customer, Customer):
            return super().get_queryset().filter(customer=customer)
        # 顧客でなければ、何も返さない
        return Reservation.objects.none()

    def create(self, request, *args, **kwargs):
        """
        新しい予約を作成し、作成された予約の詳細情報を返す
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # perform_createにログイン中の顧客(request.user)を直接渡す
        self.perform_create(serializer)
        
        # --- ここから通知処理 ---
        reservation = serializer.instance
        try:
            message = (
                f"新しい予約が入りました！\n\n"
                f"予約番号: {reservation.reservation_number}\n"
                f"お名前: {reservation.customer.name}様\n"
                f"日時: {reservation.start_time.strftime('%Y-%m-%d %H:%M')}\n"
                f"サービス: {reservation.service.name}\n\n"
                f"▼予約詳細・確定はこちら\n"
                f"https://momonail-frontend.onrender.com/admin/reservations/{reservation.reservation_number}"
            )
            send_admin_line_notification(message)
        except Exception as e:
            print(f"LINE notification failed: {e}")

        try:
            subject = f"【MomoNail】ご予約ありがとうございます（お申込内容の確認）"
            message = (
                f"{reservation.customer.name}様\n\n"
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
            recipient_list = [reservation.customer.email]
            send_mail(subject, message, from_email, recipient_list)
        except Exception as e:
            print(f"Failed to send reservation received email: {e}")

        # レスポンス用に詳細シリアライザで整形し直す
        response_serializer = ReservationSerializer(serializer.instance, context=self.get_serializer_context())
        headers = self.get_success_headers(serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """
        予約作成時に、ログイン中の顧客情報(request.user)を自動で紐付ける。
        """
        # このビューは顧客認証専用なので、request.userは必ずCustomerオブジェクト
        serializer.save(customer=self.request.user)
    
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
                f"{reservation.customer.name}様\n\n"
                f"お申し込みいただいた以下の内容で、ご予約が確定いたしました。\n"
                f"ご来店を心よりお待ちしております。\n\n"
                f"--- ご予約内容 ---\n"
                f"予約番号: {reservation.reservation_number}\n"
                f"日時: {reservation.start_time.strftime('%Y年%m月%d日 %H:%M')}\n"
                f"サービス: {reservation.service.name}\n"
                f"ご予約内容の確認・キャンセルは、以下のページからも行えます。\n"
                f"https://momonail-frontend.onrender.com/check\n\n"
                f"MomoNail"
            )
            from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@momonail.com")
            recipient_list = [reservation.customer.email]
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
            'summary': f"【予約】{reservation.customer.name}様",
            'description': (
                f"サービス: {reservation.service.name}\n"
                f"予約番号: {reservation.reservation_number}\n"
                f"連絡先: {reservation.customer.email or 'N/A'}"
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
    permission_classes = [IsAuthenticated]
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
    """
    事前に登録されたAvailableTimeSlotを元に、予約可能な時間枠を返すAPI。
    メニューの時間は考慮せず、スロットが予約済みかどうかのみをチェックします。
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        date_str = request.query_params.get('date')
        service_id = request.query_params.get('service_id')

        if not date_str or not service_id:
            return Response({"error": "日付とサービスIDは必須です。"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            # サービスIDはパラメータとして受け取りますが、空き時間計算では使用しません。
            # ただし、存在チェックは行い、無効なIDの場合はエラーを返します。
            Service.objects.get(id=service_id)
        except (ValueError, Service.DoesNotExist):
            return Response({"error": "無効な日付またはサービスIDです。"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. その日に登録されている予約可能スロットを全て取得
        potential_slots = AvailableTimeSlot.objects.filter(date=target_date)
        
        # 2. その日の既存の予約の開始時刻をセットとして取得
        booked_start_times = set(
            Reservation.objects.filter(start_time__date=target_date)
                               .values_list('start_time__time', flat=True)
        )

        # 3. 予約可能なスロットだけを絞り込む
        available_slots = []
        for slot in potential_slots:
            # ▼▼▼ ここを修正 ▼▼▼
            # モデルのフィールド名に合わせて 'slot.start_time' から 'slot.time' に変更します
            if slot.time not in booked_start_times:
                available_slots.append(slot.time.strftime('%H:%M'))
            # ▲▲▲ ここまで修正 ▲▲▲

        return Response(available_slots, status=status.HTTP_200_OK)
 
class MonthlyAvailabilityCheckAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
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
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        return Response({"status": "ok"}, status=status.HTTP_200_OK)
    
class StatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # --- 月別売上の集計 ---
        # ステータスが 'confirmed' の予約のみを対象
        sales_data = Reservation.objects.filter(status='confirmed') \
            .annotate(month=TruncMonth('start_time')) \
            .values('month') \
            .annotate(total_sales=Sum('service__price')) \
            .values('month', 'total_sales') \
            .order_by('month')

        # フロントエンドで扱いやすい形式に整形
        monthly_sales = {
            "labels": [data['month'].strftime('%Y-%m') for data in sales_data],
            "data": [data['total_sales'] for data in sales_data]
        }

        # --- 人気サービスの集計 ---
        service_ranking_data = Reservation.objects.filter(status='confirmed') \
            .values('service__name') \
            .annotate(count=Count('id')) \
            .order_by('-count')[:5] # 上位5件

        service_ranking = {
            "labels": [item['service__name'] for item in service_ranking_data],
            "data": [item['count'] for item in service_ranking_data]
        }

        # --- 予約ステータスの集計 ---
        status_counts = Reservation.objects.values('status') \
            .annotate(count=Count('id')) \
            .order_by('status')

        reservation_stats = {item['status']: item['count'] for item in status_counts}

        # レスポンスとしてデータを返す
        return Response({
            'monthly_sales': monthly_sales,
            'service_ranking': service_ranking,
            'reservation_stats': reservation_stats,
        })

class MonthlyScheduleAdminView(APIView):
    """
    管理画面向けに、指定された月の各日付のスケジュール状態を返す。(最終修正版)
    """
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        try:
            year = int(request.query_params.get('year'))
            month = int(request.query_params.get('month'))
        except (TypeError, ValueError):
            return Response({'error': 'Year and month parameters are required.'}, status=status.HTTP_400_BAD_REQUEST)

        schedules_in_month = DateSchedule.objects.filter(date__year=year, date__month=month)
        schedules_map = {schedule.date: schedule for schedule in schedules_in_month}
        weekly_defaults = {wd.day_of_week: wd for wd in WeeklyDefaultSchedule.objects.all()}

        response_data = {}
        num_days = calendar.monthrange(year, month)[1]

        for day_num in range(1, num_days + 1):
            # ★★★【バグ修正】★★★
            # datetime.date(...) ではなく、インポートした date(...) を直接使う
            # また、変数名が 'date' だとインポートしたものと衝突するため 'current_date' に変更
            current_date = date(year, month, day_num)
            
            date_str = current_date.strftime('%Y-%m-%d')
            weekday = current_date.weekday()

            schedule_info = {}
            if current_date in schedules_map:
                schedule = schedules_map[current_date]
                schedule_info['id'] = schedule.id
                if schedule.is_closed:
                    schedule_info['status'] = 'HOLIDAY'
                else:
                    schedule_info['status'] = 'SPECIAL_WORKING'
                    schedule_info['start_time'] = schedule.opening_time.strftime('%H:%M') if schedule.opening_time else None
                    schedule_info['end_time'] = schedule.closing_time.strftime('%H:%M') if schedule.closing_time else None
            elif weekday in weekly_defaults:
                default = weekly_defaults[weekday]
                if not default.is_closed:
                    schedule_info['status'] = 'DEFAULT_WORKING'
                    schedule_info['start_time'] = default.opening_time.strftime('%H:%M') if default.opening_time else None
                    schedule_info['end_time'] = default.closing_time.strftime('%H:%M') if default.closing_time else None
                else:
                    schedule_info['status'] = 'DEFAULT_HOLIDAY'
            else:
                schedule_info['status'] = 'UNDEFINED'
            
            response_data[date_str] = schedule_info

        return Response(response_data, status=status.HTTP_200_OK)
    
class TimeSlotAPIView(APIView):
    """
    指定された日付の営業時間から、30分単位の時間枠リストを返すAPI。(修正版)
    """
    authentication_classes = []
    permission_classes = [AllowAny] # ★追加
    def get(self, request, *args, **kwargs):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'Date parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        specific_schedule = DateSchedule.objects.filter(date=target_date).first()
        
        schedule_data = None
        if specific_schedule:
            if specific_schedule.is_closed: # is_holiday ではなく is_closed を参照
                return Response([], status=status.HTTP_200_OK) 
            schedule_data = {
                'opening_time': specific_schedule.opening_time,
                'closing_time': specific_schedule.closing_time
            }
        else:
            weekday = target_date.weekday()
            default_schedule = WeeklyDefaultSchedule.objects.filter(day_of_week=weekday).first()
            # ★★★【バグ修正】 is_active=True ではなく not is_closed
            if default_schedule and not default_schedule.is_closed:
                schedule_data = {
                    'opening_time': default_schedule.opening_time,
                    'closing_time': default_schedule.closing_time
                }

        if not schedule_data or not schedule_data['opening_time'] or not schedule_data['closing_time']:
            return Response([], status=status.HTTP_200_OK)

        time_slots = []
        start_time = datetime.combine(target_date, schedule_data['opening_time'])
        end_time = datetime.combine(target_date, schedule_data['closing_time'])
        current_time = start_time
        while current_time < end_time:
            time_slots.append(current_time.strftime('%H:%M'))
            current_time += timedelta(minutes=30)
            
        return Response(time_slots, status=status.HTTP_200_OK)
    
class AdminAvailableSlotView(APIView):
    """
    管理画面で、特定の日付の予約可能時間枠を管理するためのAPI
    """
    authentication_classes = [JWTAuthentication] 
    permission_classes = [IsAuthenticated] 

    def get(self, request, *args, **kwargs):
        """
        指定された日付の、設定可能な時間枠の一覧と、
        すでに設定済みの時間枠の情報を返す
        """
        date_str = request.query_params.get('date')
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()

        # その日に設定されている予約可能時間枠を取得
        saved_slots = set(slot.time for slot in AvailableTimeSlot.objects.filter(date=target_date))

        # 9:00から21:00まで30分ごとの時間枠を生成（ここは実態に合わせて変更してください）
        response_data = []
        current_time = datetime.strptime("09:00", "%H:%M").time()
        end_time = datetime.strptime("21:00", "%H:%M").time()
        
        while current_time <= end_time:
            response_data.append({
                "time": current_time.strftime('%H:%M'),
                "is_available": current_time in saved_slots
            })
            # 時間を30分進める
            current_time = (datetime.combine(target_date, current_time) + timedelta(minutes=30)).time()

        return Response(response_data)

    def post(self, request, *args, **kwargs):
        """
        指定された日付の予約可能時間枠を、受け取ったデータで上書きする
        """
        date_str = request.data.get('date')
        times = request.data.get('times', []) # ["09:00", "10:30", ...] のようなリスト
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()

        # その日の既存の設定をすべて削除
        AvailableTimeSlot.objects.filter(date=target_date).delete()

        # 新しい設定をまとめて作成
        slots_to_create = [
            AvailableTimeSlot(date=target_date, time=datetime.strptime(t, '%H:%M').time())
            for t in times
        ]
        AvailableTimeSlot.objects.bulk_create(slots_to_create)

        return Response({'status': 'success'}, status=status.HTTP_201_CREATED)
    
class ConfiguredDatesView(APIView):
    """
    指定された年月に対応する、受付時間設定済みの日付リストを返す
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            year = int(request.query_params.get('year'))
            month = int(request.query_params.get('month'))
        except (TypeError, ValueError):
            return Response({'error': 'Year and month parameters are required.'}, status=400)

        # 指定された年月の、設定済みの日付を重複なく取得
        configured_dates = AvailableTimeSlot.objects.filter(
            date__year=year,
            date__month=month
        ).annotate(
            date_only=TruncDate('date')
        ).values_list(
            'date_only', flat=True
        ).distinct()

        # フロントエンドで扱いやすいように日付を文字列に変換
        date_strings = [d.strftime('%Y-%m-%d') for d in configured_dates]

        return Response(date_strings)
    
class BookableDatesView(APIView):
    """
    顧客向けに、指定された年月に対応する予約可能な日付のリストを返す。
    （受付時間が1つでも設定されていれば予約可能とみなす）
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            year = int(request.query_params.get('year'))
            month = int(request.query_params.get('month'))
        except (TypeError, ValueError):
            return Response({'error': 'Year and month parameters are required.'}, status=400)

        # 指定された年月の、受付時間が設定されている日付を重複なく取得
        bookable_dates = AvailableTimeSlot.objects.filter(
            date__year=year,
            date__month=month
        ).annotate(
            date_only=TruncDate('date')
        ).values_list(
            'date_only', flat=True
        ).distinct()

        # 日付オブジェクトを 'YYYY-MM-DD' 形式の文字列に変換
        date_strings = [d.strftime('%Y-%m-%d') for d in bookable_dates]

        return Response(date_strings)
    
class MyReservationsView(APIView):
    # このViewに適用する認証クラスを指定
    authentication_classes = [CustomerJWTAuthentication]
    # 認証済み（この場合はCustomer）でなければアクセス不可
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # request.user には Customer オブジェクトがセットされている
        customer = request.user
        
        # 顧客に紐づく予約情報を取得して返す
        reservations = Reservation.objects.filter(customer=customer)
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data)

@method_decorator(csrf_exempt, name='dispatch')
class LineLoginCallbackView(APIView):
    # このAPIは認証不要でアクセスできるようにする
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Code not provided'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. LINE Platform APIとの通信
        try:
            token_url = 'https://api.line.me/oauth2/v2.1/token'
            client_id = os.environ.get('LINE_CHANNEL_ID')
            client_secret = os.environ.get('LINE_CHANNEL_SECRET')
            redirect_uri = os.environ.get('LINE_REDIRECT_URI')

            token_payload = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': client_id,
                'client_secret': client_secret,
            }
            token_response = requests.post(token_url, data=token_payload)
            token_response.raise_for_status()
            id_token = token_response.json().get('id_token')

            verify_url = 'https://api.line.me/oauth2/v2.1/verify'
            verify_payload = {'id_token': id_token, 'client_id': client_id}
            verify_response = requests.post(verify_url, data=verify_payload)
            verify_response.raise_for_status()
            
            profile = verify_response.json()
            line_user_id = profile.get('sub')
            display_name = profile.get('name')
            picture_url = profile.get('picture')
            email = profile.get('email')

        except requests.exceptions.RequestException as e:
            return Response({'error': 'Failed to communicate with LINE API.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. 顧客情報の取得または新規作成
        try:
            # line_user_idをキーに顧客情報を取得または作成
            customer, created = Customer.objects.update_or_create(
                line_user_id=line_user_id,
                # 新規作成の場合のデフォルト値を設定
                defaults={
                    'line_display_name': display_name,
                    'line_picture_url': picture_url,
                    'email': email,
                }
            )

            # 既存顧客の場合、LINEの情報で更新 (手動で設定した名前は上書きしない)
            if not created:
                customer.line_display_name = display_name
                customer.line_picture_url = picture_url
                customer.save(update_fields=['line_display_name', 'line_picture_url'])
            
            # --- JWT生成処理 ---
            # カスタム認証に合わせてペイロードを直接設定
            print(f"DEBUG (LineLoginCallbackView): SECRET_KEY = {settings.SECRET_KEY}") # ★追加
            refresh = RefreshToken()
            refresh['line_user_id'] = customer.line_user_id
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            # エラーログをより詳細に出力
            import traceback
            traceback.print_exc()
            return Response({'error': 'An unexpected error occurred.', 'details': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomerJWTAuthentication])
@permission_classes([IsAuthenticated])
def me(request):
    """
    現在認証されているユーザー（顧客）の情報を返す。
    """
    # このビューは顧客認証専用なので、request.userは常にCustomerオブジェクトです
    if isinstance(request.user, Customer):
        serializer = CustomerSerializer(request.user)
        return Response(serializer.data)

    # 万が一、顧客として認証できなかった場合
    return Response({"error": "顧客として認証されていません。"}, status=status.HTTP_401_UNAUTHORIZED)


class AdminReservationListView(generics.ListAPIView):
    """
    管理者用の予約リストAPI。
    settings.pyで設定したデフォルトの認証（JWTAuthentication）が適用される。
    認証済みの管理者（スーパーユーザーなど）のみがアクセス可能。
    """
    queryset = Reservation.objects.all().order_by('-start_time')
    serializer_class = ReservationSerializer

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        クエリパラメータに基づいて予約をフィルタリングする。
        """
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        status = self.request.query_params.getlist('status') # 複数のステータスに対応

        if start_date:
            queryset = queryset.filter(start_time__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__date__lte=end_date)
        if status:
            queryset = queryset.filter(status__in=status)
            
        return queryset
    
@api_view(['POST'])
@authentication_classes([CustomerJWTAuthentication])
@permission_classes([IsAuthenticated])
def confirm_reservation_and_notify(request):
    """ログイン顧客の最新予約を確認し、LINEで通知するAPI"""
    customer = request.user
    now = timezone.now()
    latest_reservation = Reservation.objects.filter(customer=customer, start_time__gte=now).order_by('start_time').first()
    if not latest_reservation:
        latest_reservation = Reservation.objects.filter(customer=customer).order_by('-start_time').first()
    if latest_reservation:
        message = f"【ご予約内容の確認】\n\nお客様のお名前: {customer.name}様\nご予約日時: {latest_reservation.start_time.strftime('%Y年%m月%d日 %H:%M')}\nメニュー: {latest_reservation.service.name}\n\nご来店を心よりお待ちしております。"
        success, result_message = send_line_push_message(customer.line_user_id, message)
        if success:
            return Response({"message": "予約情報をLINEに送信しました。"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": f"LINEの送信に失敗しました: {result_message}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        message = "お客様の有効なご予約は見つかりませんでした。"
        send_line_push_message(customer.line_user_id, message)
        return Response({"message": "予約が見つからなかったため、その旨をLINEで通知しました。"}, status=status.HTTP_404_NOT_FOUND)
    
class AdminUserManagementViewSet(viewsets.ModelViewSet):
    """
    管理者が他の管理者ユーザーを作成・管理するためのAPI
    """
    # is_staff=True のユーザー（管理者）のみを対象とする
    queryset = User.objects.filter(is_staff=True)
    serializer_class = AdminUserSerializer
    # このAPIは、Django標準のJWT認証（ユーザー名とパスワード）を使用
    authentication_classes = [JWTAuthentication]
    # DjangoのIsAdminUser権限（is_staff=Trueのユーザーのみ許可）を設定
    permission_classes = [IsAuthenticated, IsAdminUser]

    def perform_create(self, serializer):
        """
        新しい管理者ユーザーを作成する際の追加処理
        """
        # リクエストからパスワードを取得
        password = self.request.data.get('password')
        # is_staff=True でユーザーを作成
        user = serializer.save(is_staff=True)
        
        if password:
            user.set_password(password)
            user.save()
        
        # 同時にUserProfileも作成
        UserProfile.objects.create(user=user)

    @action(detail=True, methods=['post'], url_path='generate-line-link')
    def generate_line_link(self, request, pk=None):
        """
        指定された管理者ユーザーのLINE連携用リンクを生成する
        """
        user = self.get_object()
        # ユーザーに紐づくUserProfileを取得、なければ作成
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # 新しい登録トークンを生成して保存
        profile.line_registration_token = uuid.uuid4()
        profile.save()
        
        # フロントエンドの管理者用登録ページのURLを生成
        # 例: https://momonail-admin.onrender.com/register-line/xxxxxxxx-xxxx...
        base_url = os.environ.get('FRONTEND_ADMIN_URL', 'http://localhost:5173') # 環境変数がなければローカルを指す
        registration_url = f"{base_url}/register-line/{profile.line_registration_token}"
        
        return Response({'registration_link': registration_url})

class AdminLineLinkView(APIView):
    """
    管理者ユーザーアカウントとLINEアカウントを連携させるためのAPI
    """
    # このAPIは認証不要でアクセスできる必要がある
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # フロントエンドから送られてくる登録トークンとLINEの認証コードを取得
        token = request.data.get('token')
        code = request.data.get('code')

        if not token or not code:
            return Response(
                {"error": "トークンと認証コードは必須です。"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. 提供されたトークンでUserProfileを検索
        try:
            profile = UserProfile.objects.get(line_registration_token=token)
        except UserProfile.DoesNotExist:
            return Response({"error": "無効な登録リンクです。"}, status=status.HTTP_404_NOT_FOUND)

        # 2. LINEの認証コードを使って、LINEのプロフィール情報を取得
        try:
            line_profile = get_line_user_profile(code, flow_type='admin')
            line_user_id = line_profile.get('sub')
            if not line_user_id:
                raise ValueError("LINEプロファイルからユーザーIDを取得できませんでした。")
        except Exception as e:
            return Response({"error": f"LINEとの通信に失敗しました: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 3. このLINEアカウントが他の管理者に既に連携されていないか確認
        if UserProfile.objects.filter(line_user_id=line_user_id).exclude(pk=profile.pk).exists():
            return Response({"error": "このLINEアカウントは既に使用されています。"}, status=status.HTTP_409_CONFLICT)

        # 4. ユーザープロファイルにLINEユーザーIDを保存し、トークンを無効化
        profile.line_user_id = line_user_id
        profile.line_registration_token = None # トークンを一度きりにする
        profile.save()

        return Response({"message": "LINEアカウントの連携が完了しました。"}, status=status.HTTP_200_OK)


class AdminLineLoginView(APIView):
    """
    連携済みのLINEアカウントで管理者をログインさせるためのAPI
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        if not code:
            return Response({"error": "認証コードは必須です。"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. LINEの認証コードを使って、LINEのプロフィール情報を取得
        try:
            line_profile = get_line_user_profile(code, flow_type='admin')
            line_user_id = line_profile.get('sub')
            if not line_user_id:
                raise ValueError("LINEプロファイルからユーザーIDを取得できませんでした。")
        except Exception as e:
            return Response({"error": f"LINEとの通信に失敗しました: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 2. LINEユーザーIDでUserProfileを検索
        try:
            profile = UserProfile.objects.get(line_user_id=line_user_id)
        except UserProfile.DoesNotExist:
            return Response({"error": "このLINEアカウントはどの管理者にも連携されていません。"}, status=status.HTTP_404_NOT_FOUND)

        # 3. UserProfileからDjangoのUserオブジェクトを取得し、JWTを発行
        user = profile.user
        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


@method_decorator(csrf_exempt, name='dispatch') # CSRF保護を無効化
class LineWebhookView(APIView):
    """
    顧客向けLINEアカウントへのメッセージを受信し、管理者に転送するためのWebhook
    """
    authentication_classes = [] # このAPIは認証不要
    permission_classes = [AllowAny] # このAPIは誰でもアクセス可能

    def post(self, request, *args, **kwargs):
        # LINEプラットフォームからのリクエストであることを検証
        signature = request.META.get('HTTP_X_LINE_SIGNATURE')
        
        # ▼▼▼【重要】顧客向けLINEアカウントのチャネルシークレットを使用します ▼▼▼
        channel_secret = os.environ.get('CUSTOMER_LINE_CHANNEL_SECRET') 

        if not channel_secret:
            print("エラー: 顧客向けLINEチャネルシークレットが設定されていません。(CUSTOMER_LINE_CHANNEL_SECRET)")
            return HttpResponseForbidden()

        # リクエストボディを取得
        body = request.body.decode('utf-8')

        # 署名を検証
        try:
            hash = hmac.new(channel_secret.encode('utf-8'), body.encode('utf-8'), hashlib.sha256).digest()
            expected_signature = base64.b64encode(hash).decode('utf-8')

            if not hmac.compare_digest(signature, expected_signature):
                print("署名が一致しません。不正なリクエストの可能性があります。")
                return HttpResponseForbidden()
        except Exception as e:
            print(f"署名検証中にエラー: {e}")
            return HttpResponseForbidden()


        # --- ここからがメッセージ処理 ---
        try:
            events = json.loads(body).get('events', [])
            for event in events:
                # テキストメッセージイベントの場合のみ処理
                if event.get('type') == 'message' and event.get('message', {}).get('type') == 'text':
                    line_user_id = event.get('source', {}).get('userId')
                    message_text = event.get('message', {}).get('text')
                    
                    if not line_user_id or not message_text:
                        continue

                    # 送信元の顧客情報を検索
                    try:
                        customer = Customer.objects.get(line_user_id=line_user_id)
                        customer_name = customer.name or "名前未登録のお客様"
                    except Customer.DoesNotExist:
                        customer_name = "新規のお客様"

                    # 管理者への転送メッセージを作成
                    forward_message = (
                        f"【お客様からのメッセージ】\n"
                        f"送信者: {customer_name}様\n\n"
                        f"--- メッセージ本文 ---\n"
                        f"{message_text}"
                    )
                    
                    # 管理者用LINEアカウントに通知を送信
                    send_admin_line_notification(forward_message)

        except Exception as e:
            print(f"Webhook処理中にエラーが発生しました: {e}")
            return HttpResponseBadRequest()

        # LINEサーバーに正常に処理したことを伝える
        return HttpResponse(status=200)

