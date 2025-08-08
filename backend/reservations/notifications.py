import os
import requests
from django.core.mail import send_mail
from django.conf import settings

def send_line_push_message(user_id, messages, channel_access_token):
    """
    指定されたユーザーIDに、複数のメッセージ（テキスト、画像など）をリストで送信する汎用関数。
    """
    if not all([user_id, messages, channel_access_token]):
        print("エラー: LINE送信に必要な情報（ユーザーID, メッセージ, トークン）が不足しています。")
        return False, "設定またはパラメータ不足"

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {channel_access_token}'
    }
    
    if not isinstance(messages, list):
        messages = [{"type": "text", "text": str(messages)}]

    payload = {
        'to': user_id,
        'messages': messages
    }
    
    try:
        response = requests.post('https://api.line.me/v2/bot/message/push', headers=headers, json=payload)
        response.raise_for_status()
        print(f"メッセージが正常に送信されました。To: {user_id}")
        return True, "成功"
    except requests.exceptions.RequestException as e:
        print(f"LINEへのメッセージ送信に失敗しました: {e.response.text if e.response else e}")
        return False, e.response.text if e.response else str(e)


def send_admin_line_notification(message):
    """
    【管理者向け】テキストメッセージを管理者に送信する専用のショートカット関数。
    """
    admin_user_id = os.environ.get('ADMIN_LINE_USER_ID')
    channel_access_token = os.environ.get('ADMIN_LINE_CHANNEL_ACCESS_TOKEN')
    
    return send_line_push_message(
        user_id=admin_user_id,
        messages=message,
        channel_access_token=channel_access_token
    )

def send_admin_line_image(image_url):
    """
    【管理者向け】画像メッセージを管理者に送信する専用のショートカット関数。
    """
    admin_user_id = os.environ.get('ADMIN_LINE_USER_ID')
    channel_access_token = os.environ.get('ADMIN_LINE_CHANNEL_ACCESS_TOKEN')
    
    image_message = [{
        'type': 'image',
        'originalContentUrl': image_url,
        'previewImageUrl': image_url
    }]
    
    return send_line_push_message(
        user_id=admin_user_id,
        messages=image_message,
        channel_access_token=channel_access_token
    )


def send_customer_line_notification(customer, message):
    """
    顧客にLINEメッセージを送信する関数
    """
    if not customer.line_user_id:
        print(f"顧客 {customer.name} にはLINE連携が設定されていません。")
        return False, "LINE連携なし"
    
    # 顧客向けLINEチャンネルのアクセストークンを使用
    channel_access_token = os.environ.get('CUSTOMER_LINE_CHANNEL_ACCESS_TOKEN')
    
    return send_line_push_message(
        user_id=customer.line_user_id,
        messages=message,
        channel_access_token=channel_access_token
    )


def send_reservation_confirmation_email(customer, reservation, service):
    """
    予約確定メールを送信する関数
    """
    if not customer.email:
        print(f"顧客 {customer.name} にはメールアドレスが設定されていません。")
        return False, "メールアドレスなし"
    
    subject = '予約確定のお知らせ'
    
    # 予約日時を日本語形式でフォーマット
    formatted_date = reservation.start_time.strftime('%Y年%m月%d日 %H:%M')
    
    message = f"""
{customer.name} 様

いつもご利用いただきありがとうございます。
ご予約が確定いたしましたのでお知らせします。

【予約詳細】
・サービス: {service.name}
・予約日時: {formatted_date}
・所要時間: {service.duration_minutes}分
・料金: ¥{service.price:,}

ご不明な点がございましたら、お気軽にお問い合わせください。

当日のご来店をお待ちしております。
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[customer.email],
            fail_silently=False,
        )
        print(f"予約確定メールを送信しました: {customer.email}")
        return True, "成功"
    except Exception as e:
        print(f"メール送信に失敗しました: {e}")
        return False, str(e)