// frontend/src/components/admin/CustomerDetail.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { MessageSquare, FileText, History } from 'lucide-react';
import { User } from 'lucide-react';

// 型定義
interface Customer { id: number; name: string; email: string | null; phone_number: string | null; 
  line_display_name: string | null;
  line_picture_url: string | null;}
interface Reservation { id: number; reservation_number: string; start_time: string; status: string; service_name: string; }

const CustomerDetail: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const navigate = useNavigate();

  const fetchCustomerDetails = useCallback(async () => {
    if (!customerId) return;
    try {
      // 顧客の基本情報を取得
      const customerRes = await api.get(`/api/admin/customers/${customerId}/`);
      setCustomer(customerRes.data);
      // 顧客の予約履歴を取得
      const reservationsRes = await api.get(`/api/admin/customers/${customerId}/reservations/`);
      setReservations(reservationsRes.data);
    } catch (error) {
      console.error("顧客詳細の取得に失敗しました:", error);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  if (!customer) return <div>読み込み中...</div>;

  return (
    <div className="space-y-8">
      {/* 顧客基本情報セクション */}
      {/* 顧客基本情報セクション */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/admin/customers')} className="mr-4 p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-4">
             {customer.line_picture_url ? (
                <img src={customer.line_picture_url} alt="LINE Icon" className="w-16 h-16 rounded-full"/>
             ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={32} className="text-gray-500"/>
                </div>
             )}
             <div>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <p className="text-md text-gray-500">{customer.line_display_name || 'LINE名未登録'}</p>
             </div>
          </div>
        </div>
        
        <div className="space-y-3 text-gray-700 pl-4 border-l-2 ml-8">
          <div className="flex items-center">
            <strong className="w-28 text-gray-500">メールアドレス:</strong>
            <span className="break-all">{customer.email || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <strong className="w-28 text-gray-500">電話番号:</strong>
            <span>{customer.phone_number || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">アクション</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={() => navigate(`/admin/customers/${customerId}/memo`)}
            className="flex-1 flex items-center justify-center bg-gray-600 text-white px-4 py-3 rounded-md hover:bg-gray-700"
          >
            <FileText size={20} className="mr-2" /> 顧客メモを編集
          </button>
          <button
            onClick={() => navigate(`/admin/customers/${customerId}/line`)}
            className="flex-1 flex items-center justify-center bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700"
          >
            <MessageSquare size={20} className="mr-2" /> LINEでメッセージを送信
          </button>
          <button
              onClick={() => navigate(`/admin/line-history?customer_id=${customerId}`)}
              className="..."
          >
              <History size={20} className="mr-2" /> チャット履歴
          </button>
        </div>
      </div>

      {/* 予約履歴セクション */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">予約履歴</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">予約日時</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メニュー</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map(res => (
                <tr key={res.id} onClick={() => navigate(`/admin/reservations/${res.reservation_number}`)} className="hover:bg-gray-100 cursor-pointer">
                  <td className="px-6 py-4">{format(new Date(res.start_time), 'yyyy/MM/dd HH:mm')}</td>
                  <td className="px-6 py-4">{res.service_name}</td>
                  <td className="px-6 py-4">{res.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;