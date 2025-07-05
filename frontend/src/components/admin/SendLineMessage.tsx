// frontend/src/components/admin/SendLineMessage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig'; // 共通のAPIクライアントをインポート
import { ArrowLeft, Send } from 'lucide-react';

const SendLineMessage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customerName, setCustomerName] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false); // 送信中の状態管理
  const navigate = useNavigate();

  useEffect(() => {
    // 顧客名を取得して表示するため
    const fetchCustomerName = async () => {
      if (!customerId) return;
      try {
        const response = await api.get(`/api/admin/customers/${customerId}/`);
        setCustomerName(response.data.name);
      } catch (error) {
        console.error("顧客名の取得に失敗:", error);
      }
    };
    fetchCustomerName();
  }, [customerId]);

  // ★★★【送信ボタンの処理】★★★
  const handleSend = async () => {
    if (!message.trim()) {
      alert('メッセージを入力してください。');
      return;
    }
    if (!window.confirm("このメッセージを送信しますか？")) return;
    
    setIsSending(true); // 送信処理を開始
    try {
      // バックエンドの send-line API を呼び出す
      await api.post(`/api/admin/customers/${customerId}/send-line/`, { message: message });
      alert('メッセージを送信しました。');
      navigate(`/admin/customers/${customerId}`); // 送信後は顧客詳細ページに戻る
    } catch (error: any) {
      alert(`メッセージの送信に失敗しました: ${error.response?.data?.error || 'サーバーエラー'}`);
      console.error(error);
    } finally {
      setIsSending(false); // 送信処理を終了
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(`/admin/customers/${customerId}`)} className="p-2 hover:bg-gray-100 rounded-full mr-4">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">{customerName}様にLINEを送信</h2>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={15}
        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="送信するメッセージを入力..."
        disabled={isSending} // 送信中は入力を無効化
      />

      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleSend} 
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400"
          disabled={isSending} // 送信中はボタンを無効化
        >
          <Send size={18} className="mr-2" />
          {isSending ? '送信中...' : '送信する'}
        </button>
      </div>
    </div>
  );
};

export default SendLineMessage;