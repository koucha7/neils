// MomoNail/frontend/src/api/axiosConfig.ts

import axios from 'axios';

// .envファイルからAPIのベースURLを読み込む
// Vite環境では `import.meta.env` を使用します。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 環境変数が正しく設定されているかチェック
if (!API_BASE_URL) {
  console.error("VITE_API_BASE_URL is not defined in .env file.");
  // 開発中にこのエラーが出たら、`.env` ファイルが正しく設定されているか、
  // そしてDockerコンテナや開発サーバーが再起動されているか確認してください。
  throw new Error("API Base URL is not defined. Please check your .env file and ensure the frontend server is restarted.");
}

// axiosのカスタムインスタンスを作成
// これにより、すべてのAPIリクエストで同じbaseURLとヘッダーが自動的に適用されます。
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json', // JSON形式でデータを送受信することを指定
  },
});

export default api; // このインスタンスを他のコンポーネントでインポートして使用します