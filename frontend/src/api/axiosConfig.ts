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
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// isRefreshingフラグとリクエストのキュー
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: any, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// ===== レスポンスインターセプター =====
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 401エラーで、かつトークンリフレッシュの試行でない場合
        if (error.response.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                // 現在リフレッシュ中の場合は、新しいトークンが取得されるまで待機
                return new Promise(function(resolve, reject) {
                    failedQueue.push({resolve, reject});
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return axios(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                // リフレッシュトークンがない場合はログアウト処理
                console.log("No refresh token, redirecting to login.");
                localStorage.removeItem('accessToken');
                localStorage.removeItem('isLoggedIn');
                if (window.location.pathname.startsWith('/admin')) {
                    window.location.href = '/admin';
                }
                isRefreshing = false;
                return Promise.reject(error);
            }

            try {
                const rs = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
                    refresh: refreshToken
                });

                const { access } = rs.data;
                localStorage.setItem('accessToken', access);
                
                // 新しいアクセストークンをヘッダーにセット
                api.defaults.headers.common['Authorization'] = 'Bearer ' + access;
                originalRequest.headers['Authorization'] = 'Bearer ' + access;
                
                processQueue(null, access); // 待機中のリクエストを再開
                
                return api(originalRequest); // 元のリクエストを再試行
            } catch (refreshError) {
                // リフレッシュトークンも無効だった場合
                console.error("Refresh token is invalid. Logging out.", refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('isLoggedIn');
                
                processQueue(refreshError, null); // 待機中のリクエストをエラーで終了

                if (window.location.pathname.startsWith('/admin')) {
                    window.location.href = '/admin'; // ログインページにリダイレクト
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;