from django.db import models

class Salon(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    # 営業時間は別途管理方法を検討（例：ForeignKeyでOpeningHoursモデル）
    # 写真、SNSリンクなども追加可能

    def __str__(self):
        return self.name

class Service(models.Model):
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=0) # 料金
    duration_minutes = models.IntegerField() # 所要時間（分）

    def __str__(self):
        return f"{self.salon.name} - {self.name}"

class Reservation(models.Model):
    # ユーザーアカウントがないため、連絡先で紐付け
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    customer_email = models.EmailField()
    salon = models.ForeignKey(Salon, on_delete=models.CASCADE, related_name='reservations')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reservations')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    reservation_number = models.CharField(max_length=20, unique=True) # 予約番号
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('confirmed', 'Confirmed'),
            ('cancelled', 'Cancelled'),
            ('completed', 'Completed')
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"予約ID: {self.reservation_number} ({self.customer_name} at {self.salon.name} on {self.start_time})"