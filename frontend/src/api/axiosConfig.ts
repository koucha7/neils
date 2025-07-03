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
    // CSRFトークンを常に設定（DjangoのPOSTリクエストに必要）
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }

    // URLが /api/admin/ から始まる場合のみadminAccessTokenを付与
    // あるいは、特定のAPIパス（例: /api/token/refresh/, /api/admin/）にのみadminAccessTokenを付与する
    if (config.url && config.url.startsWith('/api/admin/')) {
      const adminToken = localStorage.getItem("adminAccessToken");
      if (adminToken) {
        config.headers["Authorization"] = `Bearer ${adminToken}`;
      }
    }
    // 他のAPI（顧客向けなど）ではadminAccessTokenは付与しない

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
    // 401エラーかつリフレッシュトークンが必要な場合
    // ここでのリフレッシュはadminAccessTokenのみを対象と仮定
    if (
      error.response?.status === 401 &&
      error.response.data.code === "token_not_valid" &&
      !originalRequest._retry &&
      originalRequest.url?.startsWith('/api/admin/') // admin APIのリフレッシュのみを処理
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
          // 管理者画面のログインページへリダイレクト
          window.location.href = "/admin"; 
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;