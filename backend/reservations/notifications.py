import os
import requests

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