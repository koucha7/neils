from django.contrib import admin
from .models import Salon, Service, Reservation, DateSchedule, NotificationSetting, WeeklyDefaultSchedule, AvailableTimeSlot, Customer # ← Customerをインポート

admin.site.site_header = "MomoNail管理画面 - デプロイテスト成功"
# Salon, Service, Reservation, NotificationSetting の登録
admin.site.register(Salon)
admin.site.register(Service)
admin.site.register(NotificationSetting)

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone_number', 'line_user_id', 'created_at')
    search_fields = ('name', 'email', 'phone_number', 'line_user_id')
    list_filter = ('created_at',)

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('customer', 'service', 'start_time', 'status') # ← customer_nameからcustomerに変更
    list_filter = ('status', 'start_time', 'service')
    search_fields = ('customer__name', 'customer__email', 'reservation_number') # ← 顧客名やメールで検索できるように
    readonly_fields = ('reservation_number',)

# ★ 2つのスケジュールモデルを新しい形で登録
@admin.register(WeeklyDefaultSchedule)
class WeeklyDefaultScheduleAdmin(admin.ModelAdmin):
    list_display = ('salon', 'get_day_of_week_display', 'is_closed', 'opening_time', 'closing_time')
    list_filter = ('salon',)
    ordering = ('day_of_week',)
    list_editable = ('is_closed', 'opening_time', 'closing_time')


@admin.register(DateSchedule)
class DateScheduleAdmin(admin.ModelAdmin):
    list_display = ('date', 'salon', 'is_closed', 'opening_time', 'closing_time')
    list_filter = ('salon', 'is_closed')
    ordering = ('-date',)
    date_hierarchy = 'date'