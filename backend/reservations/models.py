from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from datetime import timedelta

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

class Reservation(models.Model):
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    customer_email = models.EmailField()
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='reservations')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reservations')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    reservation_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('confirmed', 'Confirmed'), ('cancelled', 'Cancelled'), ('completed', 'Completed')], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"予約ID: {self.reservation_number} ({self.customer_name} at {self.salon.name} on {self.start_time})"

    def save(self, *args, **kwargs):
        if not self.end_time and self.start_time and self.service:
            self.end_time = self.start_time + timedelta(minutes=self.service.duration_minutes)
        super().save(*args, **kwargs)

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
    
    