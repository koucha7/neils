// frontend/src/context/AdminAuthContext.tsx

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
  const navigate = useNavigate();

  // ▼▼▼【1. isLoggedInをStateで管理】▼▼▼
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
    // ▼▼▼【2. ログイン状態を更新】▼▼▼
    setIsLoggedIn(true); // ★ Stateを更新して再レンダリングをトリガーします
  };

  // LINEでのログイン処理
  const lineLogin = async (code: string) => {
    const response = await api.post('/api/admin/login-line/', { code });
    setAuthTokens(response.data.access, response.data.refresh);
    // ▼▼▼【3. ログイン状態を更新】▼▼▼
    setIsLoggedIn(true); // ★ Stateを更新します
    navigate('/admin/reservations'); // ログイン成功後、管理画面の予約一覧に遷移
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
    // このuseEffectは初期のisLoggedInをセットする役割に絞り、
    // 実際のユーザー情報取得は各ページや共通レイアウトで行うのが望ましいです。
    const tokenExists = !!localStorage.getItem('adminAccessToken');
    if (isLoggedIn !== tokenExists) {
      setIsLoggedIn(tokenExists);
    }
    setIsLoading(false);
  }, [isLoggedIn]);

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