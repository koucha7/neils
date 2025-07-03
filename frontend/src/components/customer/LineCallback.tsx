// frontend/src/components/LineCallback.tsx

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';

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
        const response = await api.post('/api/line/callback/', { code });

        // レスポンスにトークンが含まれているか確認
        if (response.data.access && response.data.refresh) {
          // login関数に正しいデータを渡す
          login(response.data.access, response.data.refresh);
          // ログイン後のリダイレクト先
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
    const state = params.get('state');

    if (code) {
      // stateの値に応じて、ログイン後のリダイレクト先を変更
      if (state === 'check_reservation') {
        // 予約確認フローの場合
        login(code, '/check'); // login後に予約確認ページ(/check)に戻るよう指示
      } else {
        // 通常の予約フローの場合
        login(code, '/reserve'); // login後に予約ページに遷移
      }
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