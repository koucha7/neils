// frontend/src/components/admin/CustomerManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { SlidersHorizontal, ChevronUp } from 'lucide-react';

// 顧客データの型
interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  created_at: string;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState({ name: '', email: '', phone_number: '' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();

  // 顧客データを取得する関数
  const fetchCustomers = useCallback(async () => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== '')
      );
      const response = await api.get('/api/admin/customers/', { params: cleanFilters });
      setCustomers(response.data);
    } catch (error) {
      console.error("顧客データの取得に失敗しました:", error);
    }
  }, [filters]);

  // フィルターの値が変更されたら、1秒後に自動でデータを再取得
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 1000);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  const handleRowClick = (customerId: number) => {
    navigate(`/admin/customers/${customerId}`);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">顧客管理</h2>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
        >
          {isFilterOpen ? <ChevronUp size={16} /> : <SlidersHorizontal size={16} />}
          <span>検索</span>
        </button>
      </div>
      
      {/* フィルターセクション (アコーディオン) */}
      <div className={`transition-all duration-300 overflow-hidden ${isFilterOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded-md bg-gray-50">
          <input type="text" name="name" placeholder="名前で検索" value={filters.name} onChange={handleFilterChange} className="p-2 border rounded"/>
          <input type="email" name="email" placeholder="メールで検索" value={filters.email} onChange={handleFilterChange} className="p-2 border rounded"/>
          <input type="tel" name="phone_number" placeholder="電話番号で検索" value={filters.phone_number} onChange={handleFilterChange} className="p-2 border rounded"/>
        </div>
      </div>

      {/* スマホ用: カード表示 (md未満で表示) */}
      <div className="md:hidden space-y-3 mt-4">
        {customers.map((customer) => (
          <div 
            key={customer.id} 
            onClick={() => handleRowClick(customer.id)}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500 cursor-pointer"
          >
            <p className="text-lg font-semibold text-gray-800">{customer.name}</p>
            <div className="mt-2 text-sm text-gray-600 space-y-1 pl-2 border-l border-gray-200">
              <p><strong>メール:</strong> {customer.email || 'N/A'}</p>
              <p><strong>電話番号:</strong> {customer.phone_number || 'N/A'}</p>
              <p><strong>登録日:</strong> {format(new Date(customer.created_at), 'yyyy/MM/dd')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* PC用: テーブル表示 (md以上で表示) */}
      <div className="hidden md:block overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">氏名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話番号</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id} onClick={() => handleRowClick(customer.id)} className="hover:bg-gray-100 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{customer.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{customer.phone_number || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{format(new Date(customer.created_at), 'yyyy/MM/dd')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerManagement;