from reservations.models import Salon, Service

# サロンのデータを取得
salons = Salon.objects.all()
print("サロンの数:", salons.count())
for salon in salons:
    print(f"  ID: {salon.id}, 名前: {salon.name}, 住所: {salon.address}")

# サービスのデータを取得
services = Service.objects.all()
print("\nサービスの数:", services.count())
for service in services:
    print(f"  ID: {service.id}, 名前: {service.name}, 料金: {service.price}, 所要時間: {service.duration_minutes}, サロン: {service.salon.name if service.salon else 'N/A'}")