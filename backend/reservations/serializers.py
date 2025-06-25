from rest_framework import serializers
from .models import Salon, Service, Reservation, DateSchedule, NotificationSetting, WeeklyDefaultSchedule, Customer
from django.contrib.auth.models import User # ← Customerをインポート

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
    # フロントエンドから顧客情報を受け取るためのフィールドを定義
    # これらはDBには直接保存しないため、write_only=Trueとする
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
        予約作成時の顧客情報の処理をハンドルする。
        line_user_idの有無で処理を完全に分岐させる。
        """
        # ビューから渡された line_user_id を取得
        line_user_id = self.context.get('line_user_id')

        # validated_dataから顧客情報と予約情報を分離
        customer_name = validated_data.pop('customer_name')
        customer_email = validated_data.pop('customer_email')
        customer_phone = validated_data.pop('customer_phone', '')
        
        customer_obj = None # 予約に紐付ける顧客オブジェクト

        if line_user_id:
            # --- ケースA: LINEログインユーザーの場合 ---
            try:
                # 渡されたline_user_idで顧客情報を取得
                customer_obj = Customer.objects.get(line_user_id=line_user_id)
                
                # フォームから送信された内容で、既存の顧客情報を更新
                customer_obj.name = customer_name
                customer_obj.email = customer_email
                customer_obj.phone_number = customer_phone
                customer_obj.save()

            except Customer.DoesNotExist:
                # このルートは基本的にありえないが、念のためエラーハンドリング
                raise serializers.ValidationError("ログイン中の顧客情報が見つかりません。")
        else:
            # --- ケースB: ゲスト予約の場合 ---
            # メールアドレスをキーに顧客を検索または新規作成
            customer_obj, created = Customer.objects.update_or_create(
                email=customer_email,
                defaults={
                    'name': customer_name,
                    'phone_number': customer_phone,
                }
            )
        
        # 最終的に決定した顧客オブジェクトと、残りの予約情報で予約を作成
        reservation = Reservation.objects.create(customer=customer_obj, **validated_data)
        return reservation
        
class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = '__all__'