import os
import requests

def send_line_notification(message_text):
    """
    指定されたテキストメッセージをLINEに送信する共通関数
    """
    token = os.environ.get('LINE_CHANNEL_ACCESS_TOKEN')
    user_id = os.environ.get('LINE_USER_ID')

    if not token or not user_id:
        print("LINE credentials not set for notification.")
        return

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    data = {
        'to': user_id,
        'messages': [{'type': 'text', 'text': message_text}]
    }
    
    try:
        response = requests.post('https://api.line.me/v2/bot/message/push', headers=headers, json=data)
        response.raise_for_status() # エラーがあれば例外を発生
        print(f"Successfully sent LINE notification to {user_id}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to send LINE notification: {e}")
