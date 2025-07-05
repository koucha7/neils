import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

// 管理者ユーザー情報の型定義
interface AdminUser {
  id: number;
  username: string;
}

// AdminAuthContextが提供する値の型定義
interface AdminAuthContextType {
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<void>;
  lineLogin: (code: string) => Promise<void>;
  logout: () => void;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Contextを提供するAuthProviderコンポーネント
export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminAccessToken'));
  const navigate = useNavigate();

  // トークンを保存し、APIヘッダーに設定する共通関数
  const setAuthTokens = (access: string, refresh: string) => {
    localStorage.setItem('adminAccessToken', access);
    localStorage.setItem('adminRefreshToken', refresh);
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  };

  // トークンを削除する共通関数
  const clearAuthTokens = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // ユーザー名とパスワードでのログイン処理
  const login = async (username: string, password: string) => {
    const response = await api.post('/api/token/', { username, password });
    setAuthTokens(response.data.access, response.data.refresh);
    // ログイン成功後、AdminPanelが再レンダリングされて表示が切り替わる
  };

  // LINEでのログイン処理
  const lineLogin = async (code: string) => {
    const response = await api.post('/api/admin/login-line/', { code });
    setAuthTokens(response.data.access, response.data.refresh);
    navigate('/admin'); // ログイン成功後、管理画面トップに遷移
  };

  // ログアウト処理
  const logout = useCallback(() => {
    console.log("ログアウト処理を開始します..."); // デバッグ用

    // 1. ローカルストレージからトークンを削除
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');

    // 2. APIクライアントのデフォルトヘッダーをクリア（念のため）
    // api.defaults.headers.common['Authorization'] = null; // axiosConfig.tsで設定している場合は不要な場合もあります

    // 3. アプリケーションの状態を更新
    setIsLoggedIn(false);
    setUser(null);
    setToken(null);
    
    // 4. ログインページへ強制的にリダイレクト
    // navigate('/admin/login') のように、より明確なパスを指定すると確実です
    navigate('/admin'); 

    console.log("ログアウト処理が完了しました。"); // デバッグ用
  }, [navigate]);

  // アプリケーション起動時に一度だけ実行
  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // 必要であれば、トークンからユーザー情報を復元する処理をここに追加
    }
    setIsLoading(false);
  }, []);

  const value = {
    user,
    login,
    lineLogin,
    logout,
    isLoggedIn: !!localStorage.getItem('adminAccessToken'),
    isLoading,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

// コンポーネントからContextを簡単に利用するためのカスタムフック
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuthはAdminAuthProvider内で使用する必要があります');
  }
  return context;
};
