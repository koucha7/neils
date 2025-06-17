import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined in .env file.");
  throw new Error("API Base URL is not defined. Please check your .env file and ensure the frontend server is restarted.");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
    (config) => {
        // --- 認証トークンの処理 ---
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // --- URLに言語プレフィックスを追加する処理 ---
        // 1. /api/ で始まるURLのみを対象とする
        if (config.url && config.url.startsWith('/api/')) {
            const lang = localStorage.getItem('language') || 'ja';

            // 2. /api/admin/ で始まるURLは、国際化の対象外とする
            if (config.url.startsWith('/api/admin/')) {
                // そのままのURLを使用 (例: /api/admin/available-slots/)
            } else {
                // 3. それ以外の /api/ で始まるURLには言語コードを先頭に追加
                //    例: /api/reservations/ -> /ja/api/reservations/
                config.url = `/${lang}${config.url}`;
            }
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.log("401 Unauthorized. Token may be expired. Redirecting to login.");
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('isLoggedIn');
            if (window.location.pathname !== '/admin') {
                window.location.href = '/admin';
            }
        }
        return Promise.reject(error);
    }
);

export default api;