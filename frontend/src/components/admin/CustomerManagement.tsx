// frontend/src/components/admin/CustomerManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

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
  const navigate = useNavigate();

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/customers/', { params: filters });
      setCustomers(response.data);
    } catch (error) {
      console.error("顧客データの取得に失敗しました:", error);
    }
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  const handleRowClick = (customerId: number) => {
    navigate(`/admin/customers/${customerId}`);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">顧客管理</h2>
      
      {/* フィルターセクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border rounded-md">
        <input type="text" name="name" placeholder="名前で検索" value={filters.name} onChange={handleFilterChange} className="p-2 border rounded"/>
        <input type="email" name="email" placeholder="メールで検索" value={filters.email} onChange={handleFilterChange} className="p-2 border rounded"/>
        <input type="tel" name="phone_number" placeholder="電話番号で検索" value={filters.phone_number} onChange={handleFilterChange} className="p-2 border rounded"/>
      </div>

      {/* 顧客一覧テーブル */}
      <div className="overflow-x-auto">
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