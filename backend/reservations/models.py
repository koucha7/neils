from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.conf import settings
import uuid #

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="reservations_user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="reservations_user_permissions_set",
        related_query_name="user",
    )

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    def __str__(self):
        return self.email

class Salon(models.Model):
    class Meta:
        app_label = 'reservations'
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    cancellation_deadline_days = models.IntegerField(
        default=2, 
        validators=[MinValueValidator(0)],
        verbose_name="キャンセル受付期限（日数）",
        help_text="予約日の何日前までお客様自身でのキャンセルを許可するか設定します。0を指定すると当日まで可能です。"
    )

    def __str__(self):
        return self.name

class WeeklyDefaultSchedule(models.Model):
    DAY_CHOICES = ((0, '月曜日'), (1, '火曜日'), (2, '水曜日'), (3, '木曜日'), (4, '金曜日'), (5, '土曜日'), (6, '日曜日'))
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='weekly_schedules', verbose_name='サロン')
    day_of_week = models.IntegerField(choices=DAY_CHOICES, verbose_name='曜日')
    is_closed = models.BooleanField(default=False, verbose_name='休業日')
    opening_time = models.TimeField(null=True, blank=True, verbose_name='開店時間')
    closing_time = models.TimeField(null=True, blank=True, verbose_name='閉店時間')
    is_holiday = models.BooleanField(default=False)

    class Meta:
        unique_together = ('salon', 'day_of_week')
        ordering = ['day_of_week']
        verbose_name = '基本スケジュール'
        verbose_name_plural = '基本スケジュール'

    def __str__(self):
        return f"{self.salon.name} - {self.get_day_of_week_display()}"

class DateSchedule(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='date_schedules', verbose_name='サロン')
    date = models.DateField(unique=True, verbose_name='日付')
    is_closed = models.BooleanField(default=False, verbose_name='休業日')
    opening_time = models.TimeField(null=True, blank=True, verbose_name='開店時間')
    closing_time = models.TimeField(null=True, blank=True, verbose_name='閉店時間')
    is_holiday = models.BooleanField(default=False)

    class Meta:
        verbose_name = '特別スケジュール'
        verbose_name_plural = '特別スケジュール'
        ordering = ['date']

    def __str__(self):
        status = "休業日" if self.is_closed else f"{self.opening_time or ''} - {self.closing_time or ''}"
        return f"{self.date.strftime('%Y-%m-%d')} ({status})"

class Service(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=0)
    DURATION_CHOICES = [(i, f"{i} 分") for i in range(30, 241, 30)] 
    duration_minutes = models.IntegerField(choices=DURATION_CHOICES, verbose_name="所要時間(分)")

    def __str__(self):
        return f"{self.salon.name} - {self.name}"
    
class Customer(models.Model):
    id = models.BigAutoField(primary_key=True)

    line_user_id = models.CharField(
        "LINEユーザーID", max_length=255, unique=True, null=True, blank=True,
        help_text="LINEでの通知や連携に使用する一意のIDです。"
    )
    name = models.CharField("氏名", max_length=100)
    email = models.EmailField(
        'メールアドレス', unique=True, null=True, blank=True,
        help_text="顧客を一意に識別するために使用します。"
    )
    phone_number = models.CharField("電話番号", max_length=20, blank=True)
    line_display_name = models.CharField("LINE表示名", max_length=100, blank=True, help_text="LINEプロフィールの表示名です。")
    line_picture_url = models.URLField("LINEプロフィール画像URL", max_length=2048, blank=True)
    notes = models.TextField("備考", blank=True, help_text="顧客に関するメモなどを記載します。")
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    @property
    def is_authenticated(self):
        return True
    @property
    def is_anonymous(self):
        return False
    def __str__(self):
        return self.name

class Reservation(models.Model):
    reservation_number = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    # on_deleteをSET_NULLにすることで、顧客が削除されても予約は残る
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, related_name='reservations', verbose_name="顧客", null=True)
    
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='reservations')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    start_time = models.DateTimeField(null=True)
    end_time = models.DateTimeField(null=True)
    status = models.CharField(max_length=20, choices=[('pending', '保留中'), ('confirmed', '確定済み'), ('cancelled', 'キャンセル済み')], default='pending')
    def __str__(self):
        customer_name = self.customer.name if self.customer else "N/A"
        return f"{customer_name} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"

class NotificationSetting(models.Model):
    """
    管理者向け通知設定を管理するモデル。設定は全体で1つなので、常にid=1のレコードを更新する想定。
    """
    # 予約未確定リマインダー
    unconfirmed_reminder_enabled = models.BooleanField(default=True, verbose_name='【管理者向け】予約未確定リマインダーを有効にする')
    unconfirmed_reminder_days_before = models.IntegerField(
        default=2,
        validators=[MinValueValidator(1), MaxValueValidator(14)],
        verbose_name='リマインド日数（X日前に通知）',
        help_text='予約日の何日前に管理者にリマインドを送信するか設定します（1〜14日）。'
    )
    
    # スケジュールリマインダー
    schedule_reminder_enabled = models.BooleanField(default=False, verbose_name='【管理者向け】スケジュールリマインダーを有効にする')
    schedule_reminder_days_before = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(7)],
        verbose_name='リマインド日数（X日前に通知）',
        help_text='何日後までの予約状況をリマインドするか設定します（1〜7日）。'
    )

    class Meta:
        verbose_name = '通知設定'
        verbose_name_plural = '通知設定'

    def __str__(self):
        return "システム通知設定"
    
class AvailableTimeSlot(models.Model):
    """
    管理者が設定した、予約を受け付ける個別の時間枠。
    """
    date = models.DateField(verbose_name='日付')
    time = models.TimeField(verbose_name='時間')

    class Meta:
        # 同じ日付と時間の組み合わせはユニークにする
        unique_together = ('date', 'time')
        ordering = ['date', 'time']
        verbose_name = '予約可能時間枠'
        verbose_name_plural = '予約可能時間枠'

    def __str__(self):
        return f"{self.date.strftime('%Y-%m-%d')} {self.time.strftime('%H:%M')}"
    
class UserProfile(models.Model):
    """
    Djangoの標準Userモデルを拡張し、LINE連携情報を格納するためのモデル。
    """
    # DjangoのUserモデルと1対1で連携
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    
    # 管理者のLINEユーザーIDを保存するフィールド
    line_user_id = models.CharField(max_length=255, unique=True, null=True, blank=True, db_index=True)
    
    # 新規管理者がLINEアカウントを初めて連携する際に使用する、一度きりのトークン
    line_registration_token = models.UUIDField(default=uuid.uuid4, null=True, blank=True)

    def __str__(self):
        return self.user.username