import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const AdminLineRegistration = () => {
  // URLから登録トークンを取得 (例: /register-line/:token)
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    if (token) {
      // 1. 登録トークンをブラウザのセッションストレージに一時的に保存
      sessionStorage.setItem('lineRegistrationToken', token);

      // 2. LINE Developersコンソールに登録済みの「静的な」コールバックURLを指定
      const redirectUri = `${window.location.origin}/admin/callback`;
      
      // 3. これが「登録」フローであることを示すための目印（state）を設定
      const state = 'admin_link';
      
      const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${import.meta.env.VITE_LINE_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid`;
      
      // 4. LINEの認証ページにリダイレクト
      window.location.href = lineLoginUrl;
    }
  }, [token]);

  if (!token) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>無効なURL</h2>
        <p>この登録リンクは無効です。管理者に連絡して、新しいリンクを発行してもらってください。</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>LINEアカウント連携の準備をしています...</h2>
      <p>LINEの認証ページにリダイレクトします。</p>
    </div>
  );
};

export default AdminLineRegistration;
