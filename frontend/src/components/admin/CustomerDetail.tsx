import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ArrowLeft, Edit, MessageSquare, Clock, Calendar } from 'lucide-react';
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

  // ステータスを日本語に変換する関数
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return '確定';
      case 'pending':
        return '保留中';
      case 'cancelled':
        return 'キャンセル';
      case 'completed':
        return '完了';
      case 'no_show':
        return '無断欠席';
      default:
        return status;
    }
  };

  // ステータスに応じたスタイルクラスを取得する関数
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    console.log("showModal state changed:", showModal);
  }, [showModal]);

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

  if (isLoading) {
    return <div className="text-center p-10">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!customer) {
    return <div className="text-center p-10">顧客情報が見つかりません。</div>;
  }

  console.log("CustomerDetail rendering - customerId:", customerId, "customer:", customer);

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
            <h2 className="text-2xl font-bold whitespace-nowrap">{customer.name}</h2>
            <div className="mt-2 text-gray-700">
              <p>メールアドレス: {customer.email || '未登録'}</p>
              <p>電話番号: {customer.phone_number || '未登録'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* アクション */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-2">
        <h3 className="text-xl font-bold mb-4">アクション</h3>
        <div className="flex flex-wrap gap-4 border p-2">{/* デバッグ用ボーダー */}
          <button
            onClick={() => navigate(`/admin/customers/${customerId}/memo`)}
            className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            <Edit size={18} className="mr-2" />
            顧客メモを編集
          </button>
          <button
            onClick={() => navigate(`/admin/customers/${customerId}/send-message`)}
            className="inline-flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            <MessageSquare size={18} className="mr-2" />
            LINEでメッセージを送信
          </button>
          {/* ▼▼▼【ここを修正】▼▼▼ */}
          <button
            onClick={() => navigate(`/admin/customers/${customerId}/history`)}
            className="inline-flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
          >
            <Clock size={18} className="mr-2" />
            チャット履歴
          </button>
          <button
            className="inline-flex items-center bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            onClick={() => {
              console.log("予約作成ボタンがクリックされました");
              setShowModal(true);
            }}
          >
            <Calendar size={18} className="mr-2" />
            予約作成
          </button>
        </div>
      </div>

      {/* 予約履歴 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">予約履歴</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 w-1/3">予約日時</th>
                <th className="p-3 w-1/3">メニュー</th>
                <th className="p-3 w-1/3">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <tr key={reservation.reservation_number} className="border-b">
                    <td className="p-3 whitespace-nowrap">{new Date(reservation.start_time).toLocaleString('ja-JP')}</td>
                    <td className="p-3">{reservation.service_name}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusClass(reservation.status)}`}>
                        {getStatusLabel(reservation.status)}
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

      {showModal && (() => {
        console.log("Rendering ReservationForCustomerModal with customerId:", String(customer.id));
        return (
          <ReservationForCustomerModal
            customerId={String(customer.id)}
            onClose={() => {
              console.log("モーダルを閉じます");
              setShowModal(false);
            }}
          />
        );
      })()}
    </div>
  );
};

export default CustomerDetail;
