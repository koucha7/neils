import axios from "axios";

// ★★★ 1. CSRFトークンを取得するためのヘルパー関数を追加 ★★★
function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined in .env file.");
  throw new Error("API Base URL is not defined.");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===== リクエストインターセプター =====
api.interceptors.request.use(
  (config) => {
    // ★★★ 2. 既存のインターセプターにCSRFトークンの処理を追加 ★★★
    // DjangoのCSRFトークンをクッキーから取得
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      // 'X-CSRFToken' ヘッダーに取得したトークンを設定
      config.headers["X-CSRFToken"] = csrfToken;
    }

    // ===== ここから下は既存のJWT処理（変更なし）=====
    const token = localStorage.getItem("adminAccessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===== レスポンスインターセプター（変更なし） =====
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      error.response.data.code === "token_not_valid" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("adminRefreshToken");
      if (refreshToken) {
        try {
          const tokenRefreshResponse = await axios.post(
            `${API_BASE_URL}/api/token/refresh/`,
            {
              refresh: refreshToken,
            }
          );
          const newAccessToken = tokenRefreshResponse.data.access;
          localStorage.setItem("adminAccessToken", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error(
            "アクセストークンのリフレッシュに失敗しました:",
            refreshError
          );
          localStorage.removeItem("adminAccessToken");
          localStorage.removeItem("adminRefreshToken");
          window.location.href = "/admin";
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;