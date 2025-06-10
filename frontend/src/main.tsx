// MomoNail/frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// アプリケーションで使用する各ページコンポーネントをインポート
import ServiceAndReservationPicker from './components/ServiceAndReservationPicker.tsx';
import ReservationComplete from './components/ReservationComplete.tsx';
import ReservationCheck from './components/ReservationCheck.tsx';
import CancellationComplete from './components/CancellationComplete.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import ReservationDetail from './components/ReservationDetail.tsx'; // ★追加: ReservationDetailをインポート

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        {/* ユーザー向け画面 */}
        <Route path="/" element={<App />} />
        <Route path="/reserve" element={<ServiceAndReservationPicker />} />
        <Route path="/check" element={<ReservationCheck />} />
        <Route path="/cancellation-complete" element={<CancellationComplete />} />
        <Route path="/reservation-complete/:reservationNumber" element={<ReservationComplete />} />

        {/* 管理者向け画面 */}
        <Route path="/admin" element={<AdminPanel />} /> {/* ★ この行を追加 */}
        <Route path="/admin/reservations/:reservationNumber" element={<ReservationDetail />} /> {/* ★追加: 予約詳細ルート */}
      </Routes>
    </Router>
  </React.StrictMode>,
);