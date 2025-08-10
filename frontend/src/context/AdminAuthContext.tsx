// frontend/src/context/AdminAuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

// 社員情報の型定義
interface AdminUser {
  id: number;
  username: string;
  is_superuser: boolean;
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
  const navigate = useNavigate();

  // 初期値はlocalStorageにトークンがあるかどうかで設定します
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem('adminAccessToken'));

  const setAuthTokens = (access: string, refresh: string) => {
    localStorage.setItem('adminAccessToken', access);
    localStorage.setItem('adminRefreshToken', refresh);
    // apiオブジェクトのデフォルトヘッダー設定はインターセプターに任せます
  };

  const clearAuthTokens = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    setUser(null);
  };

  // ユーザー名とパスワードでのログイン処理
  const login = async (username: string, password: string) => {
    const response = await api.post('/api/token/', { username, password });
    setAuthTokens(response.data.access, response.data.refresh);
    // ユーザー情報取得
    const me = await api.get('/api/admin/me/');
    setUser(me.data);
    setIsLoggedIn(true);
  };

  // LINEでのログイン処理
  const lineLogin = async (code: string) => {
    const response = await api.post('/api/admin/login-line/', { code });
    setAuthTokens(response.data.access, response.data.refresh);
    // ユーザー情報取得
    const me = await api.get('/api/admin/me/');
    setUser(me.data);
    setIsLoggedIn(true);
    navigate('/admin/reservations');
  };

  // ログアウト処理
  const logout = useCallback(() => {
    clearAuthTokens();
    // ▼▼▼【4. ログアウト状態を更新】▼▼▼
    setIsLoggedIn(false); // ★ Stateを更新します
    navigate('/admin');   // ログアウト後、管理者ログインページへ
  }, [navigate]);

  // アプリケーション起動時の認証状態チェック
  useEffect(() => {
    const checkAuthStatus = async () => {
      const accessToken = localStorage.getItem('adminAccessToken');
      const refreshToken = localStorage.getItem('adminRefreshToken');
      
      if (!accessToken || !refreshToken) {
        setIsLoggedIn(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // トークンの有効性をチェック
      try {
        const response = await api.get('/api/admin/me/');
        setUser(response.data);
        setIsLoggedIn(true);
      } catch (error: any) {
        // 401エラーの場合はトークンが無効
        if (error.response?.status === 401) {
          console.log('トークンが無効のため、ログアウトします');
          clearAuthTokens();
          setIsLoggedIn(false);
          // 既にaxiosConfigでリダイレクトが行われるが、念のため
          navigate('/admin');
        } else {
          // その他のエラーの場合は一旦ログイン状態を維持
          setIsLoggedIn(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // 定期的にトークンの有効性をチェック（15分ごと）
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(async () => {
      try {
        await api.get('/api/admin/me/');
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.log('定期チェック: トークンが無効のため、ログアウトします');
          logout();
        }
      }
    }, 15 * 60 * 1000); // 15分ごと

    return () => clearInterval(interval);
  }, [isLoggedIn, logout]);

  const value = {
    user,
    login,
    lineLogin,
    logout,
    isLoggedIn, // ★ useStateで管理されているisLoggedInを渡します
    isLoading,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

// カスタムフック (変更なし)
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuthはAdminAuthProvider内で使用する必要があります');
  }
  return context;
};