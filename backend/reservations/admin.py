from django.contrib import admin
from .models import Salon, Service, Reservation, WeeklyDefaultSchedule, DateSchedule, NotificationSetting

# Salon, Service, Reservation, NotificationSetting の登録
admin.site.register(Salon)
admin.site.register(Service)
admin.site.register(Reservation)
admin.site.register(NotificationSetting)


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