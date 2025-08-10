import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ArrowLeft, Edit, MessageSquare, Clock, Link, Copy, CheckCircle } from 'lucide-react';
import ReservationForCustomerModal from './ReservationForCustomerModal';

// 型定義
interface Customer {
  id: number;
  name: string;
  furigana: string;
  email: string;
  phone_number: string;
  memo: string;
  created_at: string;
  line_user_id?: string;
  line_display_name?: string;
}

interface Reservation {
  reservation_number: string;
  start_time: string;
  service_name: string;
  status: string;
}

const CustomerDetail: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      setIsLoading(true);
      try {
        // 顧客情報の取得
        const customerResponse = await api.get(`/api/admin/customers/${customerId}/`);
        setCustomer(customerResponse.data);

        // 予約履歴の取得
        const reservationsResponse = await api.get(`/api/admin/customers/${customerId}/reservations/`);
        setReservations(reservationsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error("顧客詳細の取得に失敗しました:", err);
        setError("データの取得に失敗しました。ページを再読み込みしてください。");
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  // LINE連携URL生成
  const generateLineLink = async () => {
    if (!customer) return;
    
    setIsGeneratingLink(true);
    setLinkMessage('');
    
    try {
      const response = await api.post(`/api/admin/customers/${customer.id}/generate-line-link/`);
      setLinkUrl(response.data.link_url);
      setLinkMessage(response.data.message);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'LINE連携URLの生成に失敗しました。';
      setLinkMessage(errorMessage);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // URLをクリップボードにコピー
  const copyToClipboard = async () => {
    if (!linkUrl) return;
    
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('クリップボードへのコピーに失敗しました:', err);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!customer) {
    return <div className="text-center p-10">顧客情報が見つかりません。</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <button
        onClick={() => navigate('/admin/customers')}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={20} className="mr-2" />
        顧客一覧に戻る
      </button>

      {/* 顧客情報 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center">
          <div className="flex-grow">
            <p className="text-sm text-gray-500">{customer.furigana}</p>
            <h2 className="text-3xl font-bold whitespace-nowrap">{customer.name}</h2>
            <div className="mt-2 text-gray-700">
              <p>メールアドレス: {customer.email || '未登録'}</p>
              <p>電話番号: {customer.phone_number || '未登録'}</p>
              <p className="flex items-center gap-2">
                LINE連携: 
                {customer.line_user_id ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    <CheckCircle size={14} className="mr-1" />
                    連携済み
                    {customer.line_display_name && (
                      <span className="ml-1">({customer.line_display_name})</span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    未連携
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* アクション */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-bold mb-4">アクション</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate(`/admin/customers/${customerId}/memo`)}
            className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            <Edit size={18} className="mr-2" />
            顧客メモを編集
          </button>
          
          {/* LINE連携済みの場合のみメッセージ送信ボタンを表示 */}
          {customer.line_user_id && (
            <button
              onClick={() => navigate(`/admin/customers/${customerId}/send-message`)}
              className="inline-flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              <MessageSquare size={18} className="mr-2" />
              LINEでメッセージを送信
            </button>
          )}

          {/* LINE未連携の場合は連携URL作成ボタンを表示 */}
          {!customer.line_user_id && (
            <button
              onClick={generateLineLink}
              disabled={isGeneratingLink}
              className="inline-flex items-center bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <Link size={18} className="mr-2" />
              {isGeneratingLink ? 'URL生成中...' : 'LINE連携URL作成'}
            </button>
          )}

          {/* ▼▼▼【ここを修正】▼▼▼ */}
          <button
            onClick={() => navigate(`/admin/customers/${customerId}/history`)}
            className="inline-flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            <Clock size={18} className="mr-2" />
            チャット履歴
          </button>
          <button
            className="inline-flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
            onClick={() => setShowModal(true)}
          >
            予約作成
          </button>
        </div>

        {/* LINE連携URL表示 */}
        {linkUrl && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
            <h4 className="text-sm font-semibold text-purple-800 mb-2">LINE連携URL</h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={linkUrl}
                readOnly
                className="flex-1 p-2 text-sm border rounded bg-white"
              />
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                <span className="ml-1">{copied ? 'コピー済み' : 'コピー'}</span>
              </button>
            </div>
            <p className="text-xs text-purple-600 mt-2">
              このURLを顧客に送信してLINE連携を案内してください。
            </p>
          </div>
        )}

        {/* メッセージ表示 */}
        {linkMessage && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            linkMessage.includes('成功') || linkMessage.includes('生成しました') 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {linkMessage}
          </div>
        )}
      </div>

      {/* 予約履歴 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">予約履歴</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3">予約日時</th>
                <th className="p-3">メニュー</th>
                <th className="p-3">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <tr key={reservation.reservation_number} className="border-b">
                    <td className="p-3">{new Date(reservation.start_time).toLocaleString('ja-JP')}</td>
                    <td className="p-3">{reservation.service_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {reservation.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center p-4">予約履歴はありません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ReservationForCustomerModal
          customerId={String(customer.id)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default CustomerDetail;
