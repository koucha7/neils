// frontend/src/components/LineCallback.tsx

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const LineCallback = () => {
  // 1. useAuthフックからlogin関数を取得します
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 2. ログイン処理を行う非同期関数を定義します
    const handleLogin = async (code: string) => {
      try {
        // バックエンドのLINEログイン用APIエンドポイントにリクエストを送信
        // ★注意: APIのパスが異なる場合は、実際のパス（例: '/line/login/' など）に修正してください
        const response = await api.post('/api/users/line/login/', { code });

        // レスポンスにトークンが含まれているか確認
        if (response.data.access_token && response.data.refresh_token) {
          // 3. Contextのlogin関数を使ってトークンを保存します
          login(response.data.access_token, response.data.refresh_token);
          // ログイン後のリダイレクト先（例: 予約ページ）
          navigate('/reserve');
        } else {
          throw new Error("ログインレスポンスにトークンが含まれていません");
        }
      } catch (error) {
        console.error('LINEログインに失敗しました:', error);
        navigate('/login-failed');
      }
    };

    // URLから認証コードを取得
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (code) {
      // 4. 認証コードがあれば、ログイン処理を実行します
      handleLogin(code);
    } else {
      console.error("URLに認証コードが見つかりません");
      navigate('/login-failed');
    }
    
  // 5. 依存配列にlogin, location, navigate を設定します
  }, [login, location, navigate]);

  return (
    <div>
      <p>LINE認証でログインしています...</p>
      <p>画面が切り替わらない場合は、ページを再読み込みしてください。</p>
    </div>
  );
};

export default LineCallback;