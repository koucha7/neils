import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { LogIn, KeyRound } from 'lucide-react'; // アイコンをインポート

const LoginScreen: React.FC = () => {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      // ログイン成功時の処理はContextとAdminPanelが自動で行う
    } catch (err) {
      setError('ユーザー名またはパスワードが違います。');
      setIsLoading(false);
    }
  };

  const handleLineLogin = () => {
    // 管理者用のLINEログインを開始
    const redirectUri = `${window.location.origin}/admin/callback`;
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${import.meta.env.VITE_LINE_CLIENT_ID}&redirect_uri=${redirectUri}&state=admin_login&scope=profile%20openid`;
    window.location.href = lineLoginUrl;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 whitespace-nowrap">
          MomoNail 管理画面
        </h2>
        
        {error && <p className="text-center text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="text-sm font-medium text-gray-700"
            >
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="username"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 mt-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="current-password"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>
        </form>

        <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative px-2 text-sm text-gray-500 bg-white">または</div>
        </div>

        {/* ▼▼▼【ここを修正】▼▼▼ */}
        {/* 通常のログインボタンと同じスタイルを適用します */}
        <button
          onClick={handleLineLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center px-4 py-3 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.001.001a12 12 0 100 24 12 12 0 000-24zM8.887 18.01H6.385V9.38h2.502v8.63zm-1.25-9.76a1.44 1.44 0 110-2.88 1.44 1.44 0 010 2.88zm10.01 9.76h-2.5v-4.2c0-1.002-.02-2.29-1.395-2.29-1.397 0-1.612 1.09-1.612 2.218v4.272h-2.5V9.38h2.4v1.1h.033a2.62 2.62 0 012.36-1.3c2.52 0 2.985 1.66 2.985 3.818v4.444z" />
          </svg>
          LINEでログイン
        </button>
        {/* ▲▲▲ ここまで修正 ▲▲▲ */}

      </div>
    </div>
  );
};

export default LoginScreen;
