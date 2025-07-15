# backend/reservations/serializers.py

from rest_framework import serializers
from .models import Salon, Service, Reservation, NotificationSetting, Customer, UserProfile, LineMessage
from django.contrib.auth.models import User

# --- 基本的なモデルのシリアライザー ---

class SalonSerializer(serializers.ModelSerializer):
    """サロン情報用のシリアライザー"""
    class Meta:
        model = Salon
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    """サービスメニュー用のシリアライザー"""
    class Meta:
        model = Service
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    """顧客情報用のシリアライザー"""
    class Meta:
        model = Customer
        # AdminCustomerViewSetが依存しているため、フィールドが正しいか要確認
        fields = [
            'id', 
            'line_user_id', 
            'name', 
            'furigana', # 以前の定義から抜けていたため追加
            'email', 
            'phone_number', 
            'line_display_name',
            'line_picture_url',
            'notes',
            'created_at',
        ]
        read_only_fields = ['created_at']

class UserSerializer(serializers.ModelSerializer):
    """DjangoのUserモデル用の基本的なシリアライザー"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class NotificationSettingSerializer(serializers.ModelSerializer):
    """通知設定用のシリアライザー"""
    class Meta:
        model = NotificationSetting
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    """UserProfileモデル用のシリアライザー"""
    class Meta:
        model = UserProfile
        fields = ['line_user_id']

class AdminUserSerializer(serializers.ModelSerializer):
    """管理者ユーザー表示用のシリアライザー"""
    profile = UserProfileSerializer(read_only=True)
    is_line_linked = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'profile', 'is_line_linked']
    
    def get_is_line_linked(self, obj):
        """LINE連携済みかどうかのフラグを返す"""
        return hasattr(obj, 'profile') and obj.profile.line_user_id is not None

# --- 予約関連のシリアライザー ---

class ReservationSerializer(serializers.ModelSerializer):
    """予約情報（読み取り専用）のシリアライザー"""
    # 関連モデルの情報をネストして表示
    customer = CustomerSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__' # 全てのフィールドを返す


class ReservationCreateSerializer(serializers.ModelSerializer):
    """新規予約作成用のシリアライザー"""
    # フロントエンドからPOSTされる顧客情報フィールド
    customer_name = serializers.CharField(write_only=True, label="氏名")
    customer_furigana = serializers.CharField(write_only=True, label="フリガナ", required=False, allow_blank=True)
    customer_email = serializers.EmailField(write_only=True, label="メールアドレス")
    customer_phone = serializers.CharField(write_only=True, required=False, allow_blank=True, label="電話番号")
    
    class Meta:
        model = Reservation
        # 予約作成に必要なフィールドを定義
        fields = [
            'salon', 'service', 'start_time',
            'customer_name', 'customer_furigana', 'customer_email', 'customer_phone'
        ]

    def create(self, validated_data):
        """予約作成時に、顧客情報を更新または作成し、予約を新規作成する"""
        # ビューから渡されたcustomerオブジェクトを取得 (ログイン中の顧客)
        customer = validated_data.pop('customer')

        # フォームから送信された内容で、既存の顧客情報を更新
        customer.name = validated_data.pop('customer_name')
        customer.furigana = validated_data.pop('customer_furigana', customer.furigana)
        customer.email = validated_data.pop('customer_email', customer.email)
        customer.phone_number = validated_data.pop('customer_phone', customer.phone_number)
        customer.save()
        
        # 予約を作成
        reservation = Reservation.objects.create(customer=customer, **validated_data)
        return reservation

# --- LINEメッセージ関連のシリアライザー ---

class LineMessageSerializer(serializers.ModelSerializer):
    """LINEメッセージ履歴用のシリアライザー"""
    # 顧客情報をネストして表示
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_line_picture_url = serializers.URLField(source='customer.line_picture_url', read_only=True)

    class Meta:
        model = LineMessage
        fields = [
            'id', 
            'customer',
            'customer_name', 
            'customer_line_picture_url',
            'sender_type', 
            'message',
            'image_url', 
            'sent_at'
        ]
        read_only_fields = ['sent_at']
