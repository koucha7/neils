// frontend/src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { AuthProvider } from './context/AuthContext';

import ServiceAndReservationPicker from './components/ServiceAndReservationPicker.tsx';
import ReservationComplete from './components/ReservationComplete.tsx';
import ReservationCheck from './components/ReservationCheck.tsx';
import CancellationComplete from './components/CancellationComplete.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import ReservationDetail from './components/ReservationDetail.tsx';
import LineCallback from './components/LineCallback.tsx';
import LoginFailed from './components/LoginFailed.tsx';
import Manual from './components/Manual.tsx';

const NotFound = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>404 - ページが見つかりません</h2>
    <p>お探しのページは存在しないか、移動した可能性があります。</p>
    <Link to="/" style={{ color: 'blue', textDecoration: 'underline' }}>トップページに戻る</Link>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/callback" element={<LineCallback />} />
          <Route path="/login-failed" element={<LoginFailed />} />
          <Route path="/reserve" element={<ServiceAndReservationPicker />} />
          <Route path="/check" element={<ReservationCheck />} />
          <Route path="/cancellation-complete" element={<CancellationComplete />} />
          <Route path="/reservation-complete/:reservationNumber" element={<ReservationComplete />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/reservations/:reservationNumber" element={<ReservationDetail />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>,
);