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

api.interceptors.response.use(
    // 正常な応答の場合は何もしない
    (response) => {
        return response;
    },
    // エラー応答の場合の処理
    (error) => {
        // 401エラー（認証エラー）の場合
        if (error.response && error.response.status === 401) {
            console.log("401 Unauthorized. Token may be expired. Redirecting to login.");
            
            // 保存されているトークンとログイン情報をクリア
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('isLoggedIn'); // AdminPanelのログイン状態もクリア

            // ログインページにリダイレクト
            // window.location.href を使うことで、React Routerの状態もリセットされる
            if (window.location.pathname !== '/admin') {
                window.location.href = '/admin';
            }
        }
        // その他のエラーはそのまま次の処理に渡す
        return Promise.reject(error);
    }
);

export default api;