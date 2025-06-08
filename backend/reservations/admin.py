# MomoNail/backend/reservations/admin.py

from django.contrib import admin
from .models import Salon, Service, Reservation # ★★★ .models からインポートされているか確認 ★★★

admin.site.register(Salon) # ★★★★ この行があるか確認 ★★★★
admin.site.register(Service) # この行も確認
admin.site.register(Reservation) # この行も確認