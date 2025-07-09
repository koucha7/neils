import os
import uuid
import calendar
import requests
import hashlib
import hmac
import base64
import json
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .authentication import CustomerJWTAuthentication
from datetime import datetime, time, timedelta, date
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from google.auth import default as google_auth_default
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
from .notifications import send_admin_line_image

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

from .models import (
    NotificationSetting,
    Reservation,
    Salon,
    Service,
    Customer,
    AvailableTimeSlot,
    UserProfile,
)

from .serializers import (
    NotificationSettingSerializer,
    ReservationCreateSerializer,
    ReservationSerializer,
    SalonSerializer,
    ServiceSerializer,
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

class ReservationViewSet(viewsets.ModelViewSet):
    """顧客向けの予約APIビューセット"""
    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    lookup_field = "reservation_number"

    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        return ReservationSerializer

    def get_queryset(self):
        """ログインしている顧客自身の予約のみを返すように修正"""
        customer = self.request.user
        if isinstance(customer, Customer):
            return super().get_queryset().filter(customer=customer)
        return Reservation.objects.none()

    def create(self, request, *args, **kwargs):
        """新しい予約を作成し、各種通知を行う"""
        customer = self.request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        name = serializer.validated_data.get('customer_name')
        furigana = serializer.validated_data.get('customer_furigana')
        email = serializer.validated_data.get('customer_email')
        phone = serializer.validated_data.get('customer_phone')

        # 顧客情報を更新
        if name: customer.name = name
        if furigana: customer.furigana = furigana
        if email: customer.email = email
        if phone: customer.phone_number = phone
        customer.save()
        self.perform_create(serializer)
        
        # --- ここから通知処理 ---
        reservation = serializer.instance
        try:
            # (管理者へのLINE通知)
            message = (
                f"新しい予約が入りました！\n\n"
                f"予約番号: {reservation.reservation_number}\n"
                f"お名前: {reservation.customer.name}様\n"
                f"日時: {reservation.start_time.strftime('%Y-%m-%d %H:%M')}\n"
                f"サービス: {reservation.service.name}"
            )
            send_admin_line_notification(message)
        except Exception as e:
            print(f"管理者へのLINE通知に失敗しました: {e}")

        try:
            # (顧客への予約受付メール)
            if reservation.customer.email:
                subject = "【MomoNail】ご予約ありがとうございます（お申込内容の確認）"
                message = (
                    f"{reservation.customer.name}様\n\n"
                    f"この度は、MomoNailにご予約いただき、誠にありがとうございます。\n"
                    f"以下の内容でご予約を承りました。ネイリストが内容を確認後、改めて「予約確定メール」をお送りしますので、今しばらくお待ちください。\n\n"
                    f"--- ご予約内容 ---\n"
                    f"予約番号: {reservation.reservation_number}\n"
                    f"日時: {reservation.start_time.strftime('%Y年%m月%d日 %H:%M')}\n"
                    f"サービス: {reservation.service.name}\n"
                    f"------------------"
                )
                from_email = os.environ.get("DEFAULT_FROM_EMAIL")
                send_mail(subject, message, from_email, [reservation.customer.email])
        except Exception as e:
            print(f"予約受付メールの送信に失敗しました: {e}")

        response_serializer = ReservationSerializer(serializer.instance)
        headers = self.get_success_headers(serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """
        予約作成時に終了時刻を計算し、ログイン顧客と紐付けて保存する。
        """
        # 1. 予約されたサービスと開始時刻を取得
        service = serializer.validated_data.get('service')
        start_time = serializer.validated_data.get('start_time')

        # 2. サービスの所要時間から終了時刻を計算
        duration = timedelta(minutes=service.duration_minutes)
        end_time = start_time + duration
        
        # 3. ログイン中の顧客情報と、計算した終了時刻を渡して保存
        serializer.save(customer=self.request.user, end_time=end_time)

        
    
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
        """Googleカレンダーに予約イベントを追加するヘルパーメソッド"""
        SCOPES = ['https://www.googleapis.com/auth/calendar']
        CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID')

        if not CALENDAR_ID:
            print("エラー: 環境変数 GOOGLE_CALENDAR_ID が設定されていません。")
            return

        try:
            # --- ここからが今回の修正の最重要ポイント ---
            # ファイル名を直接指定するのではなく、環境変数から自動で認証情報を取得します。
            # Render上では GOOGLE_APPLICATION_CREDENTIALS が参照されます。
            credentials, project = google_auth_default(scopes=SCOPES)
            
            service = build('calendar', 'v3', credentials=credentials)
            
            event = {
                'summary': f"【予約】{reservation.customer.name}様",
                'description': (
                    f"サービス: {reservation.service.name}\n"
                    f"予約番号: {reservation.reservation_number}\n"
                    f"連絡先: {reservation.customer.email or 'メールアドレス未登録'}"
                ),
                'start': {'dateTime': reservation.start_time.isoformat(), 'timeZone': 'Asia/Tokyo'},
                'end': {'dateTime': reservation.end_time.isoformat(), 'timeZone': 'Asia/Tokyo'},
            }
            service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
            print(f"成功: Googleカレンダーにイベントを登録しました (予約番号: {reservation.reservation_number})")
        
        except Exception as e:
            print(f"エラー: Google認証またはAPI呼び出しに失敗しました。詳細: {e}")
    
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
    
class TimeSlotAPIView(APIView):
    """
    指定された日付の営業時間から、30分単位の時間枠リストを返すAPI。(修正版)
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    def get(self, request, *args, **kwargs):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'Date parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
        
        schedule_data = None

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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

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
    
class AdminUserViewSet(viewsets.ModelViewSet):
    """
    管理者ユーザーの参照、作成、更新、削除を行うためのAPI。
    LINE連携URLの生成機能も含む。
    """
    queryset = User.objects.all().order_by('date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser] # 管理者のみアクセス可能

    @action(detail=True, methods=['post'], url_path='generate-line-link')
    def generate_line_link(self, request, pk=None):
        """
        指定された管理者ユーザーのLINE連携用リンクを生成する
        """
        user = self.get_object()
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # 新しい登録トークンを生成して保存
        token = uuid.uuid4()
        profile.line_registration_token = token
        profile.save()
        
        # ▼▼▼【ここから修正】▼▼▼
        # 環境変数からフロントエンドのURLを取得
        # VITE_APP_FRONTEND_URL のような、より明確な名前の環境変数を参照するのが望ましい
        base_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173') 
        
        # フロントエンドに作成した連携用ページのパスを正しく指定
        registration_url = f"{base_url}/register-line/{token}"
        
        print(f"生成された連携URL: {registration_url}") # デバッグ用にURLをコンソールに出力
        # ▲▲▲【修正ここまで】▲▲▲
        
        return Response({'registration_link': registration_url})
    
    def create(self, request, *args, **kwargs):
        """
        新しい管理者ユーザーを作成する。
        パスワードはハッシュ化して保存する。
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # パスワードを取得し、ハッシュ化してユーザーを作成
        user = User.objects.create_user(
            email=serializer.validated_data['email'],
            username=serializer.validated_data['username'],
            password=request.data.get('password'),
            is_superuser=serializer.validated_data.get('is_superuser', False)
        )
        
        # 作成したユーザー情報を返す
        response_serializer = self.get_serializer(user)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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


@method_decorator(csrf_exempt, name='dispatch')
class LineWebhookView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # ... (署名検証のロジックは変更なし) ...

        try:
            events = json.loads(request.body.decode('utf-8')).get('events', [])
            for event in events:
                if event.get('type') == 'message':
                    source = event.get('source', {})
                    message = event.get('message', {})
                    line_user_id = source.get('userId')
                    message_type = message.get('type')

                    if not line_user_id:
                        continue

                    # --- 顧客情報の取得 ---
                    try:
                        customer = Customer.objects.get(line_user_id=line_user_id)
                        customer_name = customer.name or "名前未登録"
                    except Customer.DoesNotExist:
                        customer_name = "新規のお客様"

                    # --- テキストメッセージの処理 ---
                    if message_type == 'text':
                        message_text = message.get('text')
                        forward_message = (
                            f"【お客様からのメッセージ】\n"
                            f"送信者: {customer_name}様\n\n"
                            f"{message_text}"
                        )
                        send_admin_line_notification(forward_message)

                    # ★★★【画像メッセージの処理を追加】★★★
                    elif message_type == 'image':
                        self.handle_image_message(line_user_id, customer_name, message.get('id'))

        except Exception as e:
            print(f"Webhook処理中にエラーが発生しました: {e}")
            return HttpResponseBadRequest()

        return HttpResponse(status=200)

    def handle_image_message(self, line_user_id, customer_name, message_id):
        """画像メッセージを処理してGCSにアップロードし、管理者に転送する"""
        channel_access_token = os.environ.get('CUSTOMER_LINE_CHANNEL_ACCESS_TOKEN')
        if not channel_access_token:
            print("エラー: 顧客向けチャネルアクセストークンが設定されていません。")
            return

        # 1. LINEサーバーから画像をダウンロード
        content_url = f"https://api-data.line.me/v2/bot/message/{message_id}/content"
        headers = {'Authorization': f'Bearer {channel_access_token}'}
        try:
            response = requests.get(content_url, headers=headers, stream=True)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"LINEからの画像ダウンロードに失敗: {e}")
            return

        # 2. GCSに画像を保存 (django-storagesが自動で処理)
        file_name = f"line_images/{uuid.uuid4()}.jpg"
        file_path = default_storage.save(file_name, ContentFile(response.content))

        # 3. GCS上の公開URLを取得
        # ★★★ ここが重要な変更点 ★★★
        image_url = default_storage.url(file_path)

        print(f"GCSに保存完了。転送する画像URL: {image_url}")

        # 4. 管理者にテキストと画像を転送
        text_message = f"【お客様からの画像】\n送信者: {customer_name}様"
        send_admin_line_notification(text_message)
        send_admin_line_image(image_url)

class AdminReservationViewSet(viewsets.ModelViewSet):
    """
    管理者用の予約管理APIビューセット。
    """
    serializer_class = ReservationSerializer
    queryset = Reservation.objects.all().order_by('start_time')
    lookup_field = 'reservation_number'
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        # (このメソッドに変更はありません)
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        status_list = self.request.query_params.getlist('status')
        if start_date:
            queryset = queryset.filter(start_time__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__date__lte=end_date)
        if status_list:
            queryset = queryset.filter(status__in=status_list)
        return queryset

    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm(self, request, reservation_number=None):
        """予約を「確定済み」に更新し、各種通知を送信するアクション"""
        reservation = self.get_object()
        if reservation.status != 'pending':
            return Response(
                {'error': 'この予約は保留中でないため、確定できません。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = 'confirmed'
        reservation.save()

        # --- 通知処理 ---
        try:
            if reservation.customer and reservation.customer.email:
                subject = f"【MomoNail】ご予約が確定いたしました"
                message = (
                    f"{reservation.customer.name}様\n\n"
                    f"お申し込みいただいた内容でご予約が確定いたしました。\n"
                    f"ご来店を心よりお待ちしております。\n\n"
                    f"--- ご予約内容 ---\n"
                    f"予約番号: {reservation.reservation_number}\n"
                    f"日時: {reservation.start_time.strftime('%Y年%m月%d日 %H:%M')}\n"
                    f"サービス: {reservation.service.name}\n"
                )
                from_email = os.environ.get("DEFAULT_FROM_EMAIL")
                send_mail(subject, message, from_email, [reservation.customer.email])
        except Exception as e:
            print(f"予約確定メールの送信に失敗しました: {e}")

        try:
            # self を付けてクラス内のメソッドとして呼び出します
            self.add_event_to_google_calendar(reservation)
        except Exception as e:
            print(f"Googleカレンダーへの登録に失敗しました: {e}")
        
        return Response({'status': 'reservation confirmed'})

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, reservation_number=None):
        # (このメソッドに変更はありません)
        reservation = self.get_object()
        if reservation.status in ['completed', 'cancelled']:
            return Response(
                {'error': 'この予約は完了またはキャンセル済みのため、変更できません。'},
                status=status.HTTP_400_BAD_REQUEST
            )
        reservation.status = 'cancelled'
        reservation.save()
        return Response({'status': 'reservation cancelled'})

    # このメソッドが、confirmやcancelと同じインデント（階層）で
    # クラス内に正しく定義されていることを確認してください。
    def add_event_to_google_calendar(self, reservation):
        """Googleカレンダーに予約イベントを追加するヘルパーメソッド"""
        SCOPES = ['https://www.googleapis.com/auth/calendar']
        SERVICE_ACCOUNT_FILE = 'google_credentials.json'
        CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID')

        if not CALENDAR_ID:
            print("環境変数 GOOGLE_CALENDAR_ID が設定されていません。")
            return

        try:
            creds = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        except Exception as e:
            print(f"Google認証情報の読み込みに失敗しました: {e}")
            return
            
        service = build('calendar', 'v3', credentials=creds)
        event = {
            'summary': f"【予約】{reservation.customer.name}様",
            'description': (
                f"サービス: {reservation.service.name}\n"
                f"予約番号: {reservation.reservation_number}\n"
                f"連絡先: {reservation.customer.email or 'メールアドレス未登録'}"
            ),
            'start': {'dateTime': reservation.start_time.isoformat(), 'timeZone': 'Asia/Tokyo'},
            'end': {'dateTime': reservation.end_time.isoformat(), 'timeZone': 'Asia/Tokyo'},
        }
        service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
        print(f"Googleカレンダーにイベントを登録しました: {reservation.reservation_number}")

class AdminCustomerViewSet(viewsets.ModelViewSet):
    """
    管理者用の顧客管理API。
    一覧、詳細、更新、予約履歴、メッセージ送信を扱う。
    """
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]
    # ★ parser_classesを追加して、ファイルとJSONの両方を受け取れるようにする
    parser_classes = [MultiPartParser, JSONParser]

    def get_queryset(self):
        """名前、メール、電話番号で顧客を検索する機能"""
        queryset = super().get_queryset()
        name = self.request.query_params.get('name')
        email = self.request.query_params.get('email')
        phone = self.request.query_params.get('phone_number')

        if name:
            queryset = queryset.filter(name__icontains=name)
        if email:
            queryset = queryset.filter(email__icontains=email)
        if phone:
            queryset = queryset.filter(phone_number__icontains=phone)
            
        return queryset

    @action(detail=True, methods=['get'])
    def reservations(self, request, pk=None):
        """特定の顧客の予約履歴を返すアクション"""
        customer = self.get_object()
        reservations = Reservation.objects.filter(customer=customer).order_by('-start_time')
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data)
    
    # ▼▼▼【send_lineを削除し、新しいsend_messageアクションを定義】▼▼▼
    @action(detail=True, methods=['post'], url_path='send-message')
    def send_message(self, request, pk=None):
        """特定の顧客にLINEメッセージ（テキストまたは画像）を送信する"""
        customer = self.get_object()
        if not customer.line_user_id:
            return Response({'error': 'この顧客はLINE連携していません。'}, status=status.HTTP_400_BAD_REQUEST)

        message_text = request.data.get('message', '')
        image_file = request.FILES.get('image')

        if not message_text and not image_file:
            return Response({'error': 'メッセージまたは画像を指定してください。'}, status=status.HTTP_400_BAD_REQUEST)

        # 顧客向けチャネルのアクセストークンを取得
        token = os.environ.get('CUSTOMER_LINE_CHANNEL_ACCESS_TOKEN')
        if not token:
            return Response({'error': '顧客向けLINEチャネルのトークンが設定されていません。'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            messages_to_send = []

            # 1. 画像が添付されていた場合の処理
            if image_file:
                file_name = f"admin_sent/{uuid.uuid4()}.jpg"
                file_path = default_storage.save(file_name, image_file)
                image_url = default_storage.url(file_path)
                
                messages_to_send.append({
                    "type": "image",
                    "originalContentUrl": image_url,
                    "previewImageUrl": image_url
                })

            # 2. テキストが入力されていた場合の処理
            if message_text:
                messages_to_send.append({
                    "type": "text",
                    "text": message_text
                })
            
            # 3. 組み立てたメッセージを顧客に送信
            if messages_to_send:
                send_line_push_message(customer.line_user_id, messages_to_send, token)

            return Response({'status': 'メッセージを送信しました。'})

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)