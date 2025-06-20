from rest_framework import serializers
from .models import Salon, Service, Reservation, DateSchedule, NotificationSetting, WeeklyDefaultSchedule, Customer # ← Customerをインポート

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
        fields = '__all__'

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
    # 顧客情報はビュー側で処理するため、このシリアライザからは顧客情報を削除
    # 代わりに、予約作成時にフロントエンドから送られてくる顧客情報を定義する
    customer_name = serializers.CharField(required=False, allow_blank=True, help_text="予約時に更新する場合の顧客名")
    customer_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True, help_text="予約時に更新する場合のメールアドレス")
    customer_phone = serializers.CharField(required=False, allow_blank=True, help_text="予約時に更新する場合の電話番号")

    class Meta:
        model = Reservation
        fields = [
            'salon', 
            'service', 
            'start_time',
            'customer_name',
            'customer_email',
            'customer_phone',
        ]
        
class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = '__all__'