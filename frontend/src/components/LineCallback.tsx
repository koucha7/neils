import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axiosConfig';

const LineCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    // stateの検証もここで行うのが望ましい

    if (code) {
      api.post('/api/auth/line/callback/', { code })
        .then(response => {
          // バックエンドから受け取ったトークンを保存
          localStorage.setItem('accessToken', response.data.access);
          localStorage.setItem('refreshToken', response.data.refresh);
          localStorage.setItem('isLoggedIn', 'true');
          
          // 予約ページに移動
          navigate('/reserve');
        })
        .catch(error => {
          console.error('LINE Login Failed:', error);
          // エラーページに移動
          navigate('/login-failed');
        });
    }
  }, [searchParams, navigate]);

  return <div>ログイン処理中...</div>;
};

export default LineCallback;