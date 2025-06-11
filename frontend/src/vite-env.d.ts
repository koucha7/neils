// MomoNail/frontend/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // 必要に応じて他の環境変数も追加
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}