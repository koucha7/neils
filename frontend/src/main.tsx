// MomoNail/frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// アプリケーションで使用する各ページコンポーネントをインポート
import ServiceAndReservationPicker from './components/ServiceAndReservationPicker.tsx';
import ReservationComplete from './components/ReservationComplete.tsx';
import ReservationCheck from './components/ReservationCheck.tsx';
import CancellationComplete from './components/CancellationComplete.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import ReservationDetail from './components/ReservationDetail.tsx';

// Not Foundページ用のシンプルなコンポーネント
function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>404 - ページが見つかりません</h2>
      <p>お探しのページは存在しないか、移動した可能性があります。</p>
      <Link to="/" style={{ color: 'blue', textDecoration: 'underline' }}>トップページに戻る</Link>
    </div>
  );
}

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
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/reservations/:reservationNumber" element={<ReservationDetail />} />
        {/* ★★★ ここから追加：他のどのルートにも一致しない場合に表示 ★★★ */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  </React.StrictMode>,
);