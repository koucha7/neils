import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

const ConfirmReservation = () => {
  const { isAuthenticated, user } = useAuth();
  const [message, setMessage] = useState('LINEログインを確認しています...');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // このページにアクセスした時点で、認証済みかどうかをチェック
    if (isAuthenticated && user) {
      // ログイン済みの場合、すぐにAPIを呼び出す
      setMessage('最新の予約情報を検索し、LINEに送信しています...');
      
      api.post('/api/confirm-reservation-and-notify/')
        .then(response => {
          setMessage('最新の予約情報をLINEに送信しました。LINEアプリをご確認ください。');
        })
        .catch(err => {
          if (err.response && err.response.status === 404) {
            setMessage('ご予約が見つかりませんでした。その旨をLINEでお知らせしました。');
          } else {
            setError('情報の取得・送信中にエラーが発生しました。時間をおいて再度お試しください。');
            console.error(err);
          }
        })
        .finally(() => {
          setIsProcessing(false);
        });

    } else {
      // 未ログインの場合、LINEログインページにリダイレクトさせる
      // ログイン後の戻り先として、このページのURLを指定する
      const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${import.meta.env.VITE_LINE_CLIENT_ID}&redirect_uri=${window.location.origin}/callback&state=confirm_reservation&scope=profile%20openid`;
      window.location.href = lineLoginUrl;
    }
  }, [isAuthenticated, user]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>予約情報確認</h2>
      {isProcessing && <p>{message}</p>}
      {!isProcessing && !error && <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ConfirmReservation;
