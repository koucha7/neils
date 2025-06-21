import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// (インターフェース定義などは変更なし)
interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // 修正: localStorageから読み出すキーをスネークケースに
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('access_token'));
    const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refresh_token'));

    useEffect(() => {
        // 修正: こちらも同様にスネークケースに
        const storedAccessToken = localStorage.getItem('access_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');
        if (storedAccessToken) {
            setAccessToken(storedAccessToken);
        }
        if (storedRefreshToken) {
            setRefreshToken(storedRefreshToken);
        }
    }, []);

    const login = (newAccessToken: string, newRefreshToken: string) => {
        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);
        // 修正: localStorageへ保存するキーをスネークケースに
        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
    };

    const logout = () => {
        setAccessToken(null);
        setRefreshToken(null);
        // 修正: localStorageから削除するキーをスネークケースに
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    };

    const value = {
        accessToken,
        refreshToken,
        login,
        logout,
        isAuthenticated: !!accessToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};