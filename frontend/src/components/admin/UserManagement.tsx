// frontend/src/components/admin/UserManagement.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // ★ 1. useNavigateをインポート
import { CheckCircle, XCircle, UserPlus } from 'lucide-react';
import api from '../../api/axiosConfig';

// 社員の型定義
interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  is_superuser: boolean;
  is_line_linked: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const navigate = useNavigate(); // ★ 2. navigate関数を初期化

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get<AdminUser[]>('/api/admin/users/');
      setUsers(response.data);
    } catch (error) {
      console.error("ユーザーデータの取得に失敗しました:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ★ 3. 行がクリックされたときに実行される関数を定義
  const handleRowClick = (userId: number) => {
    navigate(`/admin/users/${userId}`);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold whitespace-nowrap">社員管理</h2>
        <button 
          onClick={() => navigate('/admin/users/new')} // 新規作成ページへの遷移を有効化
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border rounded-lg hover:bg-blue-700"
        >
          <UserPlus size={16} />
          <span>新規追加</span>
        </button>
      </div>

      {/* スマホ用: カード表示 */}
      <div className="md:hidden space-y-3 mt-4">
        {users.map((user) => (
          <div 
            key={user.id} 
            // ▼▼▼【4. スマホ用のカードにもクリックイベントを追加】▼▼▼
            onClick={() => handleRowClick(user.id)}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500 cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-800">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email || 'N/A'}</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {user.is_superuser && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    Superuser
                  </span>
                )}
                {user.is_line_linked ? (
                  <span className="flex items-center text-xs text-green-600"><CheckCircle size={14} className="mr-1" /> 連携済み</span>
                ) : (
                  <span className="flex items-center text-xs text-gray-500"><XCircle size={14} className="mr-1" /> 未連携</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PC用: テーブル表示 */}
      <div className="hidden md:block overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">権限</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LINE連携</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              // ▼▼▼【5. PC用のテーブル行にもクリックイベントを追加】▼▼▼
              <tr key={user.id} onClick={() => handleRowClick(user.id)} className="hover:bg-gray-100 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_superuser ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      Superuser
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      一般
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_line_linked ? (
                    <span className="flex items-center text-green-600"><CheckCircle size={16} className="mr-1" /> 連携済み</span>
                  ) : (
                    <span className="flex items-center text-gray-500"><XCircle size={16} className="mr-1" /> 未連携</span>
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