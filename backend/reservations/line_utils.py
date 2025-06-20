import os
import requests
from django.conf import settings

def get_line_user_profile(code: str) -> dict:
    """
    フロントエンドから受け取った認証コードを使い、LINEプラットフォームから
    ユーザーのプロフィール情報を取得する。
    """
    try:
        # 環境変数からLINEログインに必要な設定値を取得
        channel_id = os.environ.get('LINE_CHANNEL_ID')
        channel_secret = os.environ.get('LINE_CHANNEL_SECRET')
        redirect_uri = os.environ.get('LINE_REDIRECT_URI')

        if not all([channel_id, channel_secret, redirect_uri]):
            raise ValueError("LINEの環境変数が設定されていません。(ID, SECRET, REDIRECT_URI)")

        # 1. 認証コードを使ってアクセストークン（とIDトークン）を取得
        token_url = 'https://api.line.me/oauth2/v2.1/token'
        token_payload = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': channel_id,
            'client_secret': channel_secret,
        }
        token_response = requests.post(token_url, data=token_payload)
        token_response.raise_for_status()  # エラーがあれば例外を発生
        
        id_token = token_response.json().get('id_token')
        if not id_token:
            raise ValueError("LINEからの応答にIDトークンが含まれていません。")

        # 2. IDトークンを検証し、ユーザープロフィールを取得
        verify_url = 'https://api.line.me/oauth2/v2.1/verify'
        verify_payload = {'id_token': id_token, 'client_id': channel_id}
        verify_response = requests.post(verify_url, data=verify_payload)
        verify_response.raise_for_status()

        # 検証済みのプロフィール情報を返す
        return verify_response.json()

    except requests.exceptions.RequestException as e:
        # LINE APIとの通信でエラーが発生した場合
        print(f"LINE APIとの通信に失敗しました: {e}")
        if e.response is not None:
            print(f"エラー詳細: {e.response.status_code} - {e.response.text}")
        # エラーを呼び出し元に再スローして、適切なエラーレスポンスを返せるようにする
        raise e
    except ValueError as e:
        print(f"設定値またはLINEの応答に問題があります: {e}")
        raise e

