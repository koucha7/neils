import os
import requests
from django.conf import settings

def get_line_user_profile(code: str, flow_type: str = 'customer') -> dict:
    """
    認証コードを使い、LINEからユーザープロフィールを取得する。
    flow_typeに応じて正しいリダイレクトURIを使い分けます。
    """
    try:
        channel_id = os.environ.get('LINE_CHANNEL_ID')
        channel_secret = os.environ.get('LINE_CHANNEL_SECRET')
        
        # 環境変数からフロントエンドのベースURLを取得
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

        # flow_typeに応じてコールバックURLを動的に決定
        if flow_type == 'admin':
            redirect_uri = f"{frontend_url}/admin/callback"
        else:
            redirect_uri = f"{frontend_url}/callback"

        if not all([channel_id, channel_secret, redirect_uri]):
            raise ValueError("LINEの環境変数が設定されていません。(ID, SECRET, FRONTEND_URL)")

        # 1. アクセストークンを取得
        token_url = 'https://api.line.me/oauth2/v2.1/token'
        token_payload = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': channel_id,
            'client_secret': channel_secret,
        }
        
        # ▼▼▼【デバッグコード】▼▼▼
        # LINEに送信する直前のredirect_uriをコンソールに出力します
        print("--- LINE Token Request ---")
        print(f"Sending redirect_uri: {redirect_uri}")
        print("--------------------------")
        
        token_response = requests.post(token_url, data=token_payload)
        token_response.raise_for_status()
        
        id_token = token_response.json().get('id_token')
        if not id_token:
            raise ValueError("LINEからの応答にIDトークンが含まれていません。")

        # 2. IDトークンを検証し、プロフィールを取得
        verify_url = 'https://api.line.me/oauth2/v2.1/verify'
        verify_payload = {'id_token': id_token, 'client_id': channel_id}
        verify_response = requests.post(verify_url, data=verify_payload)
        verify_response.raise_for_status()

        return verify_response.json()

    except requests.exceptions.RequestException as e:
        print(f"LINE APIとの通信に失敗しました: {e}")
        if e.response is not None:
            print(f"エラー詳細: {e.response.status_code} - {e.response.text}")
        raise e
    except ValueError as e:
        print(f"設定値またはLINEの応答に問題があります: {e}")
        raise e
