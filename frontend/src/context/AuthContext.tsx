import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// コンテキストが提供する値の型を定義
interface AuthContextType {
  isLoggedIn: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

// AuthContextを作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProviderコンポーネントを作成
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // useStateでisLoggedInの状態を管理。初期値はlocalStorageから取得
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  // login関数
  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('isLoggedIn', 'true'); // isLoggedinも保存
    setIsLoggedIn(true);
  };

  // logout関数
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  // コンポーネントのマウント時にログイン状態をチェック
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // コンテキストプロバイダーを返す
  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuthカスタムフック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};