import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import api from '../../api/axiosConfig';

const AdminLineCallback = () => {
  const { lineLogin } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('認証処理を実行中です...');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state'); // ログインか連携かを見分けるための'state'を取得

    if (!code) {
      setError('認証に失敗しました。もう一度お試しください。');
      return;
    }

    // stateの値に応じて処理を分岐
    if (state === 'admin_link') {
      // --- アカウント連携フロー ---
      setMessage('アカウントを連携しています...');
      const registrationToken = sessionStorage.getItem('lineRegistrationToken');
      if (!registrationToken) {
        setError('登録セッションが見つかりません。お手数ですが、もう一度連携リンクからやり直してください。');
        return;
      }
      
      api.post('/api/admin/link-line/', { token: registrationToken, code: code })
        .then(() => {
          sessionStorage.removeItem('lineRegistrationToken'); // 使用済みのトークンを削除
          setMessage('LINEアカウントの連携が完了しました！このウィンドウは閉じて構いません。');
        })
        .catch((err) => {
          setError(err.response?.data?.error || 'アカウントの連携に失敗しました。');
        });

    } else if (state === 'admin_login') {
      // --- 通常のログインフロー ---
      setMessage('ログイン処理を実行中です...');
      lineLogin(code).catch((err) => {
        setError('LINEログインに失敗しました。アカウントが連携されていないか、システムエラーが発生しました。');
        // エラー発生後、3秒待ってからログイン画面に戻る
        setTimeout(() => navigate('/admin'), 3000);
      });

    } else {
      setError('無効なリクエストです。');
    }
  // このuseEffectは初回マウント時のみ実行するため、依存配列は空にします
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>管理者LINE認証処理</h2>
      {message && !error && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AdminLineCallback;
