import os
import requests

def send_line_push_message(target_user_id, message_text):
    """
    【顧客向け】
    指定されたLINEユーザーIDにプッシュメッセージを送信する。
    顧客向けアカウントのトークンを使用します。
    """
    print("--- デバッグ情報：LINE関連の環境変数 ---")
    for key, value in os.environ.items():
        if "LINE" in key:
            print(f"キー: '{key}', 値: '{value}'")
    print("------------------------------------")
    # ▼▼▼ 1. 顧客向けアカウントのトークンを取得 ▼▼▼
    channel_access_token = os.environ.get('CUSTOMER_LINE_CHANNEL_ACCESS_TOKEN')

    if not channel_access_token:
        print("エラー: 【顧客向け】LINEのチャネルアクセストークンが設定されていません。")
        return False, "顧客向けチャネルアクセストークンが未設定です"

    if not target_user_id:
        print("エラー: 送信先のユーザーIDが指定されていません。")
        return False, "送信先ユーザーIDが未指定です"

    headers = {
        'Authorization': f'Bearer {channel_access_token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'to': target_user_id,
        'messages': [{'type': 'text', 'text': message_text}]
    }
    
    try:
        response = requests.post('https://api.line.me/v2/bot/message/push', headers=headers, json=data)
        response.raise_for_status()
        print(f"顧客向けメッセージが正常に送信されました。 To: {target_user_id}")
        return True, "送信成功"
    except requests.exceptions.RequestException as e:
        print(f"顧客向けメッセージの送信に失敗しました: {e}")
        if e.response is not None:
            print(f"エラー詳細: {e.response.text}")
            return False, e.response.text
        return False, str(e)


def send_admin_line_notification(message_text):
    """
    【管理者向け】
    環境変数に設定された管理者（オーナー）にLINE通知を送信する。
    管理者向けアカウントのトークンを使用します。
    """
    # ▼▼▼ 2. 管理者向けアカウントのトークンを取得 ▼▼▼
    channel_access_token = os.environ.get('ADMIN_LINE_CHANNEL_ACCESS_TOKEN')
    admin_user_id = os.environ.get('ADMIN_LINE_USER_ID') # 管理者のLINEユーザーID

    if not channel_access_token:
        print("エラー: 【管理者向け】LINEのチャネルアクセストークンが設定されていません。")
        return
        
    if not admin_user_id:
        print("エラー: 【管理者向け】LINEユーザーIDが設定されていません。")
        return

    headers = {
        'Authorization': f'Bearer {channel_access_token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'to': admin_user_id,
        'messages': [{'type': 'text', 'text': message_text}]
    }
    
    try:
        response = requests.post('https://api.line.me/v2/bot/message/push', headers=headers, json=data)
        response.raise_for_status()
        print(f"管理者向け通知が正常に送信されました。")
    except requests.exceptions.RequestException as e:
        print(f"管理者向け通知の送信に失敗しました: {e}")
