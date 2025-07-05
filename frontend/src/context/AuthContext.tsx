import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig'; // axiosのカスタムインスタンスをインポート

// ユーザー情報の型定義
interface User {
  id: number;
  name: string;
  email?: string;
}

// AuthContextが提供する値の型定義
interface AuthContextType {
  user: User | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Contextの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Contextを提供するAuthProviderコンポーネント
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 初期ロード状態の管理
  const navigate = useNavigate();

  // ログイン処理
  const login = async (code: string, redirectPath: string = '/reserve') => {
    const MAX_RETRIES = 3; // 最大リトライ回数
    let lastError: any = null;

    // 最大3回までログインを試行します
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`ログイン試行 ${attempt}回目...`);
        const response = await api.post('/api/line/callback/', { code });
        const { access, refresh } = response.data;

        if (access && refresh) {
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          
          await fetchUser();
          navigate(redirectPath);
          return; // ログイン成功！処理を終了します
        }
        // トークンが返ってこなかった場合もエラーとして扱う
        throw new Error("レスポンスにトークンが含まれていません");

      } catch (error: any) {
        lastError = error;
        console.error(`ログイン試行 ${attempt}回目 失敗:`, error);

        // ネットワークエラーやサーバーエラー(500番台)の場合のみリトライ
        const isRetryable = error.code === 'ERR_NETWORK' || (error.response && error.response.status >= 500);

        if (isRetryable && attempt < MAX_RETRIES) {
          // 待機時間を徐々に長くする（例: 2秒、4秒）
          const delay = Math.pow(2, attempt) * 1000; 
          console.log(`${delay / 1000}秒後に再試行します...`);
          await sleep(delay);
        } else {
          // リトライ不可能なエラーか、最大試行回数に達した場合はループを抜ける
          break;
        }
      }
    }

    // すべてのリトライが失敗した場合
    console.error("すべてのログイン試行に失敗しました:", lastError);
    logout(); // 最終的に失敗した場合のみログアウト処理
    navigate('/login-failed');
  };

  // ユーザー情報を取得する関数
  const fetchUser = async () => {
    try {
      const response = await api.get('/api/me/');
      setUser(response.data);
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
      // ユーザー情報取得に失敗した場合、不正なトークンが残っている可能性があるのでログアウトさせる
      logout();
    }
  };

  // ログアウト処理
  const logout = () => {
    // localStorageからトークンを削除
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // APIヘッダーとユーザー情報をクリア
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    // ログインページへリダイレクト
    navigate('/login');
  };

  // アプリケーション起動時に一度だけ実行される処理
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // ページを再読み込みした際に、保存済みのトークンで認証状態を復元
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    }
    setIsLoading(false); // 初期ロード完了
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user, // userオブジェクトが存在すれば認証済み
    isLoading,
  };

  // 初期ロード中は何も表示しない（画面のちらつき防止）
  if (isLoading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// コンポーネントからContextを簡単に利用するためのカスタムフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthはAuthProvider内で使用する必要があります');
  }
  return context;
};