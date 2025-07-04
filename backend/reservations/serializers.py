from rest_framework import serializers
from .models import Salon, Service, Reservation, DateSchedule, NotificationSetting, WeeklyDefaultSchedule, Customer, UserProfile
from django.contrib.auth.models import User

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

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'line_user_id', 'name', 'email', 'phone_number', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ReservationSerializer(serializers.ModelSerializer):
    # ▼▼▼ 以下の1行を追加 ▼▼▼
    # 予約情報に顧客の詳細情報を含めるようにする
    customer = CustomerSerializer(read_only=True)
    
    # serviceフィールドも同様に詳細を表示するように変更（任意ですが推奨）
    service = ServiceSerializer(read_only=True)

    class Meta:
        model = Reservation
        # ▼▼▼ customerフィールドを削除し、fieldsを'__all__'に変更 ▼▼▼
        fields = '__all__'

class ReservationCreateSerializer(serializers.ModelSerializer):
    # フロントエンドからPOSTされる顧客情報フィールド
    customer_name = serializers.CharField(write_only=True, label="氏名")
    customer_email = serializers.EmailField(write_only=True, label="メールアドレス")
    customer_phone = serializers.CharField(write_only=True, required=False, allow_blank=True, label="電話番号")

    class Meta:
        model = Reservation
        fields = [
            'salon', 'service', 'start_time',
            'customer_name', 'customer_email', 'customer_phone'
        ]

    def create(self, validated_data):
        """
        予約作成時に、ログイン中の顧客情報を更新し、予約を新規作成する
        """
        # ビューのperform_createから渡されたcustomerオブジェクトを取得
        customer = validated_data.pop('customer')

        # フォームから送信された内容で、既存の顧客情報を更新
        customer.name = validated_data.pop('customer_name')
        customer.email = validated_data.pop('customer_email')
        customer.phone_number = validated_data.pop('customer_phone', customer.phone_number)
        customer.save()
        
        # 予約を作成
        reservation = Reservation.objects.create(customer=customer, **validated_data)
        return reservation
        
class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    """
    UserProfileモデル用のシリアライザー
    """
    class Meta:
        model = UserProfile
        # APIで返す情報として、LINEユーザーIDのみを指定
        fields = ['line_user_id']

class AdminUserSerializer(serializers.ModelSerializer):
    """
    管理者ユーザーの一覧表示・詳細表示用のシリアライザー
    """
    # 関連するUserProfileの情報をネストして表示
    profile = UserProfileSerializer(read_only=True)
    # LINEが連携済みかどうかを判定するカスタムフィールド
    is_line_linked = serializers.SerializerMethodField()

    class Meta:
        model = User
        # APIで返すフィールドを定義
        fields = ['id', 'username', 'email', 'is_staff', 'profile', 'is_line_linked']
    
    def get_is_line_linked(self, obj):
        """
        is_line_linkedフィールドの値を動的に生成するメソッド
        """
        # ユーザーにprofileがあり、かつそのprofileにline_user_idが設定されていればTrueを返す
        return hasattr(obj, 'profile') and obj.profile.line_user_id is not None
