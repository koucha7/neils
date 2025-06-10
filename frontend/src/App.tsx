// MomoNail/frontend/src/App.tsx
import React from 'react';
import './App.css'; // 必要であれば、App固有のCSS (例: Tailwind CSSがメインなら不要な場合も)
import { Link } from 'react-router-dom'; // ページ遷移のためのLinkコンポーネント

function App() {
  return (
    // アプリケーションのメインコンテナ。flexboxで中央配置し、背景色を設定
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* ヘッダー部分 */}
      <header className="w-full max-w-4xl bg-blue-700 text-white p-4 rounded-t-lg shadow-md">
        <nav className="flex justify-between items-center">
          {/* 左側のロゴ（トップページへのリンク） */}
          <Link to="/" className="text-2xl font-bold">MomoNail</Link>
          {/* 右側のナビゲーションリンク */}
          <div>
            {/* サロン選択が不要なので、直接予約開始ページへリンク */}
            <Link to="/check" className="ml-4 text-lg hover:underline">予約確認</Link>
          </div>
        </nav>
      </header>

      {/* メインコンテンツエリア */}
      <main className="w-full max-w-4xl bg-white p-8 rounded-b-lg shadow-lg">
        {/* アプリケーションのメインタイトル */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">MomoNailへようこそ！</h1>
        {/* 説明文 */}
        <p className="text-center text-gray-600 mb-8">
          当サロンで最高のネイル体験をお楽しみください。<br />
          お客様のご都合に合わせて、オンラインで簡単にメニューを選んでご予約いただけます。
        </p>
        {/* 予約開始への誘導ボタン */}
        <div className="text-center">
          <Link to="/reserve" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105">
            今すぐ予約する
          </Link>
        </div>
      </main>
    </div>
  );
}

export default App;