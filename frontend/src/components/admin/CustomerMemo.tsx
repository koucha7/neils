// frontend/src/components/admin/CustomerMemo.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ArrowLeft, Save } from 'lucide-react';

interface Customer { name: string; notes: string | null; }

const CustomerMemo: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return;
      try {
        const response = await api.get(`/api/admin/customers/${customerId}/`);
        setCustomer(response.data);
        setNotes(response.data.notes || '');
      } catch (error) {
        console.error("顧客情報の取得に失敗:", error);
      }
    };
    fetchCustomer();
  }, [customerId]);

  const handleSave = async () => {
    try {
      await api.patch(`/api/admin/customers/${customerId}/`, { notes: notes });
      alert('メモを保存しました。');
      navigate(`/admin/customers/${customerId}`);
    } catch (error) {
      alert('メモの保存に失敗しました。');
      console.error(error);
    }
  };

  if (!customer) return <div>読み込み中...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(`/admin/customers/${customerId}`)} className="p-2 hover:bg-gray-100 rounded-full mr-4">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold whitespace-nowrap">{customer.name}様のメモ</h2>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={15}
        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="顧客に関するメモを入力..."
      />
      <div className="mt-6 flex justify-end">
        <button onClick={handleSave} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          <Save size={18} className="mr-2" /> 保存する
        </button>
      </div>
    </div>
  );
};

export default CustomerMemo;