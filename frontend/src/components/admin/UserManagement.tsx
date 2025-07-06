// frontend/src/components/admin/UserManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import { UserPlus } from 'lucide-react';

// 管理者ユーザーの型
interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  is_superuser: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/users/');
      setUsers(response.data);
    } catch (error) {
      console.error("ユーザーデータの取得に失敗しました:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">管理者ユーザー管理</h2>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border rounded-lg hover:bg-blue-700">
          <UserPlus size={16} />
          <span>新規追加</span>
        </button>
      </div>

      {/* スマホ用: カード表示 (md未満で表示) */}
      <div className="md:hidden space-y-3 mt-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-gray-800">{user.username}</p>
              {user.is_superuser && (
                 <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                   Superuser
                 </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              <strong>メール:</strong> {user.email || 'N/A'}
            </p>
          </div>
        ))}
      </div>

      {/* PC用: テーブル表示 (md以上で表示) */}
      <div className="hidden md:block overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">権限</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_superuser && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      Superuser
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;