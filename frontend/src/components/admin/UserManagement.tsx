import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import { UserPlus, Link2, CheckCircle, AlertCircle } from 'lucide-react';

// ユーザー情報の型定義
interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_line_linked: boolean;
}

// メッセージ表示用のコンポーネント
const Notification: React.FC<{ message: string; type: 'success' | 'error' }> = ({ message, type }) => {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div className={`p-3 mb-4 rounded-md text-sm ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      <div className="flex items-center">
        {isSuccess ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
        <span>{message}</span>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/users/');
      setUsers(response.data);
    } catch (err) {
      setError('ユーザー一覧の取得に失敗しました。');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!newUsername.trim() || !newPassword.trim()) {
      setError("ユーザー名とパスワードは必須です。");
      return;
    }
    try {
      await api.post('/api/admin/users/', {
        username: newUsername,
        password: newPassword,
      });
      setSuccessMessage(`${newUsername}さんを新しい管理者として登録しました。`);
      setNewUsername('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      setError('ユーザーの作成に失敗しました。ユーザー名が重複している可能性があります。');
    }
  };

  const handleGenerateLink = async (userId: number) => {
    setError('');
    setSuccessMessage('');
    try {
      const response = await api.post(`/api/admin/users/${userId}/generate-line-link/`);
      const link = response.data.registration_link;
      navigator.clipboard.writeText(link);
      setSuccessMessage('連携リンクをクリップボードにコピーしました。対象の管理者にお渡しください。');
    } catch (err) {
      setError('連携リンクの生成に失敗しました。');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">ユーザー管理</h1>

      <Notification message={error} type="error" />
      <Notification message={successMessage} type="success" />

      {/* 新規管理者登録セクション */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
          <UserPlus className="text-2xl font-bold" />
          新規管理者登録
        </h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="new-username">
                ユーザー名
              </label>
              <input
                id="new-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例: staff01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="new-password">
                パスワード
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="********"
              />
            </div>
          </div>
          <div className="text-right">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              登録する
            </button>
          </div>
        </form>
      </div>

      {/* 管理者一覧セクション */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">管理者一覧</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー名</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LINE連携</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_line_linked ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        連携済み
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        未連携
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!user.is_line_linked && (
                      <button
                        onClick={() => handleGenerateLink(user.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        連携リンク発行
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;