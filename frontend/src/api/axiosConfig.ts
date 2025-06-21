// frontend/src/api/axiosConfig.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined in .env file.");
  throw new Error("API Base URL is not defined.");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== リクエストインターセプター =====
api.interceptors.request.use(
    (config) => {
        // 'accessToken' と 'refresh_token' のキー名を統一するため、AuthContext.tsxなどに合わせてください。
        // ここでは 'access_token', 'refresh_token' を使用します。
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// ===== レスポンスインターセプター =====
api.interceptors.response.use(
    // 正常なレスポンスはそのまま返します。
    (response) => {
        return response;
    },
    // エラーレスポンスを処理します。
    async (error) => {
        const originalRequest = error.config;

        // 401エラー、かつトークン無効のエラーコードで、まだリトライしていない場合に処理を実行
        if (error.response?.status === 401 && error.response.data.code === 'token_not_valid' && !originalRequest._retry) {
            originalRequest._retry = true; // 無限ループを避けるため、リトライ済みフラグを立てる

            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    // リフレッシュトークンを使って新しいアクセストークンを要求
                    const tokenRefreshResponse = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
                        refresh: refreshToken
                    });

                    const newAccessToken = tokenRefreshResponse.data.access;

                    // 新しいアクセストークンを保存
                    localStorage.setItem('access_token', newAccessToken);

                    // 元のリクエストのヘッダーを新しいトークンで更新
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    // 元のリクエストを再試行
                    return api(originalRequest);

                } catch (refreshError) {
                    console.error('アクセストークンのリフレッシュに失敗しました:', refreshError);
                    // リフレッシュに失敗した場合（リフレッシュトークンも無効な場合など）は、
                    // ユーザーをログアウトさせ、ログインページにリダイレクトします。
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    
                    // AuthContextの状態も更新することが望ましいですが、
                    // ここではシンプルにページをリロードして対応します。
                    window.location.href = '/login'; // ご自身のログインページのパスに合わせてください

                    return Promise.reject(refreshError);
                }
            }
        }
        // 上記以外のエラーはそのままエラーとして処理
        return Promise.reject(error);
    }
);

export default api;