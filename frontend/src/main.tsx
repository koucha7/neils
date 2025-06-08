// MomoNail/frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
// BrowserRouter (Router), Routes, Route を react-router-dom からインポート
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx'; // アプリケーションの基本レイアウトコンポーネント
import './index.css'; // グローバルCSS

// アプリケーションで使用する各ページコンポーネントをインポート
import ServiceAndReservationPicker from './components/ServiceAndReservationPicker.tsx'; // メインの予約フロー
import ReservationComplete from './components/ReservationComplete.tsx'; // 予約完了画面

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* アプリケーション全体をRouterでラップすることで、ルーティング機能が有効になります */}
    <Router>
      {/* Routesコンポーネントの中に、個々のルーティングルールを定義します */}
      <Routes>
        {/* '/' パスにアクセスしたときに App コンポーネントを表示 */}
        <Route path="/" element={<App />} />

        {/* '/reserve' パスにアクセスしたときに ServiceAndReservationPicker コンポーネントを表示 */}
        {/* サロンが1つなので、直接この予約フローに進みます */}
        <Route path="/reserve" element={<ServiceAndReservationPicker />} />

        {/* '/reservation-complete/:reservationNumber' パスにアクセスしたときに ReservationComplete を表示 */}
        {/* ':reservationNumber' はURLの動的な部分（パラメータ）で、予約番号がここに入ります */}
        <Route path="/reservation-complete/:reservationNumber" element={<ReservationComplete />} />

        {/* 将来的に、予約履歴確認などのパスを追加する場合の例 */}
        {/* <Route path="/my-reservation" element={<MyReservation />} /> */}

        {/* 定義されていないパスにアクセスした場合のフォールバック (例: 404ページ) */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  </React.StrictMode>,
);