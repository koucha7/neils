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

// ===== リクエストインターセプター (ここが最重要の修正箇所です) =====
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        /* if (config.url) {
            const lang = localStorage.getItem('language') || 'ja';
            
            // 国際化対象のURLの場合のみ言語プレフィックスを付与
            if (
                config.url.startsWith('/api/') && 
                !config.url.startsWith('/api/admin/') && 
                // ↓↓↓↓ この行を削除またはコメントアウトします ↓↓↓↓
                // !config.url.startsWith('/api/token') && 
                !config.url.startsWith('/api/health')
            ) {
                 config.url = `/${lang}${config.url}`;
            }
        } */
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ===== レスポンスインターセプター (変更なし) =====
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
            if (window.location.pathname.startsWith('/admin')) {
                window.location.href = '/admin';
            }
        }
        return Promise.reject(error);
    }
);

export default api;