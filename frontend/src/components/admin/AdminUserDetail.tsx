// frontend/src/components/admin/AdminUserDetail.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Link as LinkIcon, CheckCircle, XCircle, Copy } from 'lucide-react';
import api from '../../api/axiosConfig';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  is_superuser: boolean;
  is_line_linked: boolean;
}

const AdminUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [lineLinkUrl, setLineLinkUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get(`/api/admin/users/${userId}/`);
      setUser(response.data);
    } catch (error) {
      console.error("ユーザー詳細の取得に失敗:", error);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleGenerateLink = async () => {
    if (!userId) return;
    setIsGenerating(true);
    setLineLinkUrl(null); // URLを一旦クリア
    try {
      // バックエンドの正しいAPIを呼び出す
      const response = await api.post(`/api/admin/users/${userId}/generate-line-link/`);
      setLineLinkUrl(response.data.registration_link);
    } catch (error) {
      alert('連携用URLの生成に失敗しました。');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const copyToClipboard = () => {
    if (!lineLinkUrl) return;
    navigator.clipboard.writeText(lineLinkUrl);
    alert('連携用URLをクリップボードにコピーしました。');
  };

  if (!user) return <div>読み込み中...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-gray-100 rounded-full mr-4">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold whitespace-nowrap">{user.username} の詳細</h2>
      </div>

      <div className="space-y-4">
        <div><strong>メールアドレス:</strong> {user.email}</div>
        <div><strong>権限:</strong> {user.is_superuser ? 'Superuser' : '一般管理者'}</div>
      </div>

      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-4">LINEアカウント連携</h3>
        {user.is_line_linked ? (
          <div className="flex items-center text-green-600"><CheckCircle size={20} className="mr-2" />連携済みです。</div>
        ) : (
          <div>
            <div className="flex items-center text-gray-600 mb-4"><XCircle size={20} className="mr-2" />まだ連携されていません。</div>
            <button 
              onClick={handleGenerateLink} 
              disabled={isGenerating}
              className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400"
            >
              <LinkIcon size={18} className="mr-2" /> 
              {isGenerating ? '生成中...' : '連携用URLを生成する'}
            </button>
            {lineLinkUrl && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-700 mb-2">以下のURLを対象の管理者に伝え、個人のLINEアプリでアクセスしてもらってください。</p>
                <div className="flex items-center gap-2">
                  <input type="text" value={lineLinkUrl} readOnly className="flex-1 p-2 border rounded-md bg-gray-200" />
                  <button onClick={copyToClipboard} className="p-2 bg-gray-300 hover:bg-gray-400 rounded-md">
                    <Copy size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserDetail;