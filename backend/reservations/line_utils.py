import os
import requests
from django.conf import settings
import traceback # エラーの詳細を出力するためにインポート

def get_line_user_profile(code: str, flow_type: str = 'customer') -> dict:
    """
    認証コードを使い、LINEからユーザープロフィールを取得する。
    flow_typeに応じて正しいリダイレクトURIを使い分けます。
    """
    print(f"--- get_line_user_profile 開始 (flow: {flow_type}) ---")
    try:
        # --- 1. 環境変数の読み込み ---
        channel_id = os.environ.get('LINE_CHANNEL_ID')
        channel_secret = os.environ.get('LINE_CHANNEL_SECRET')
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        
        print(f"  - 読み込み成功: LINE_CHANNEL_ID: {'設定済み' if channel_id else '未設定'}")
        print(f"  - 読み込み成功: LINE_CHANNEL_SECRET: {'設定済み' if channel_secret else '未設定'}")
        print(f"  - 読み込み成功: FRONTEND_URL: {frontend_url}")

        if flow_type == 'admin':
            redirect_uri = f"{frontend_url}/admin/callback"
        else:
            redirect_uri = f"{frontend_url}/callback"
        
        print(f"  - 生成された redirect_uri: {redirect_uri}")

        if not all([channel_id, channel_secret, frontend_url]):
            raise ValueError("LINEの環境変数が設定されていません。(ID, SECRET, FRONTEND_URL)")

        # --- 2. アクセストークンの要求 ---
        token_url = 'https://api.line.me/oauth2/v2.1/token'
        token_payload = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
            'client_id': channel_id,
            'client_secret': channel_secret,
        }
        
        print(f"  - LINEにトークンを要求します... URL: {token_url}")
        token_response = requests.post(token_url, data=token_payload)
        print(f"  - LINEからの応答ステータス: {token_response.status_code}")
        token_response.raise_for_status() # エラーがあればここで例外が発生
        
        token_data = token_response.json()
        id_token = token_data.get('id_token')
        if not id_token:
            raise ValueError("LINEからの応答にIDトークンが含まれていません。")
        
        print("  - IDトークンの取得に成功しました。")

        # --- 3. IDトークンの検証とプロフィール取得 ---
        verify_url = 'https://api.line.me/oauth2/v2.1/verify'
        verify_payload = {'id_token': id_token, 'client_id': channel_id}
        
        print(f"  - IDトークンを検証します... URL: {verify_url}")
        verify_response = requests.post(verify_url, data=verify_payload)
        print(f"  - LINEからの検証応答ステータス: {verify_response.status_code}")
        verify_response.raise_for_status()

        user_profile = verify_response.json()
        print("  - プロフィールの取得に成功しました。")
        print("--- get_line_user_profile 正常終了 ---")
        return user_profile

    except requests.exceptions.RequestException as e:
        print(f"【エラー】LINE APIとの通信に失敗しました: {e}")
        if e.response is not None:
            print(f"【エラー詳細】ステータス: {e.response.status_code}, 応答: {e.response.text}")
        raise e
    except Exception as e:
        # 予期せぬその他のエラーをキャッチして詳細を出力
        print(f"【予期せぬエラー】get_line_user_profile内でエラーが発生しました: {e}")
        traceback.print_exc() # トレースバックを出力
        raise e
