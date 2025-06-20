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
import LineCallback from './components/LineCallback'; 
import LoginFailed from './components/LoginFailed';
import Manual from './components/Manual.tsx';
import { AuthProvider } from './context/AuthContext'; // ★ AuthProviderをインポート
import LineCallback from './components/LineCallback'; // ★ LineCallbackをインポート
import LoginFailed from './components/LoginFailed';   // ★ LoginFailedをインポート

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
    return (
    <AuthProvider> {/* ★ AuthProviderで全体をラップ */}
      <Router>
        <div className="App bg-gray-100 min-h-screen">
          <Routes>
            <Route path="/" element={<ServiceAndReservationPicker />} />
            <Route path="/complete" element={<ReservationComplete />} />
            <Route path="/check" element={<ReservationCheck />} />
            <Route path="/reservations/:reservationNumber" element={<ReservationDetail />} />
            <Route path="/cancellation-complete" element={<CancellationComplete />} />
            <Route path="/admin" element={<AdminPanel />} />
            {/* <Route path="/admin/reservations" element={<AdminReservationList />} /> */}
            {/* <Route path="/admin/reservations/:reservationId" element={<AdminReservationDetail />} /> */}
            <Route path="/admin/statistics" element={<StatisticsPanel />} />
            <Route path="/admin/manual" element={<Manual />} />
            <Route path="/auth/line/callback" element={<LineCallback />} /> {/* ★ LINEコールバック用ルート */}
            <Route path="/login-failed" element={<LoginFailed />} /> {/* ★ ログイン失敗時用ルート */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
  </React.StrictMode>,
);