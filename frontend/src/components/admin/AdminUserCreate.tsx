// frontend/src/components/admin/AdminUserCreate.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/axiosConfig';

const AdminUserCreate: React.FC = () => {
  const [username, setUsername] = useState(''); // ログインID
  const [fullName, setFullName] = useState(''); // 氏名
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/api/admin/users/', {
        username,
        full_name: fullName,
        email,
        password,
        is_superuser: isSuperuser,
      });
      alert('新しい管理者を登録しました。');
      navigate('/admin/users'); // 登録後、一覧ページに戻る
    } catch (err: any) {
      setError(err.response?.data?.detail || '登録に失敗しました。入力内容を確認してください。');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-gray-100 rounded-full mr-4">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">社員の新規追加</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">ログインID</label>
          <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full p-2 mt-1 border rounded-md"/>
        </div>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">氏名</label>
          <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full p-2 mt-1 border rounded-md"/>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 mt-1 border rounded-md"/>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-2 mt-1 border rounded-md"/>
        </div>
        <div className="flex items-center">
          <input id="isSuperuser" type="checkbox" checked={isSuperuser} onChange={(e) => setIsSuperuser(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
          <label htmlFor="isSuperuser" className="ml-2 block text-sm text-gray-900">スーパーユーザー権限を付与する</label>
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <div>
          <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
            {isSubmitting ? '登録中...' : '登録する'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserCreate;