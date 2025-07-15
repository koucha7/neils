import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

// --- コンポーネントのインポート ---
// 顧客向け
import LandingPage from './components/customer/LandingPage';
import ServiceAndReservationPicker from './components/customer/ServiceAndReservationPicker';
import ReservationComplete from './components/customer/ReservationComplete';
import ReservationCheck from './components/customer/ReservationCheck';
import ReservationDetail from './components/customer/ReservationDetail';
import CancellationComplete from './components/customer/CancellationComplete';
import LineCallback from './components/customer/LineCallback';
import LoginFailed from './components/customer/LoginFailed';
import Manual from './components/customer/Manual';
import ConfirmReservation from './components/customer/ConfirmReservation';
import AdminLineRegistration from './components/admin/AdminLineRegistration';
import AdminLineCallback from './components/admin/AdminLineCallback';
import LineHistoryPage from "./components/admin/LineHistoryPage";

// 管理者向け
import AdminPanel from './components/admin/AdminPanel';

// 404ページ用のコンポーネント
const NotFound = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>404 - ページが見つかりません</h2>
    <p>お探しのページは存在しないか、移動した可能性があります。</p>
    <Link to="/" style={{ color: 'blue', textDecoration: 'underline' }}>トップページに戻る</Link>
  </div>
);


function App() {
  return (
    // ▼▼▼ ここを修正 ▼▼▼
    // Routerを一番外側にして、アプリケーション全体でルーティング機能を有効にします
    <Router>
      {/* AuthProviderをRouterの内側に配置します */}
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            {/* --- 顧客向けページのルーティング --- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/reserve" element={<ServiceAndReservationPicker />} />
            <Route path="/reservation-complete/:reservationNumber" element={<ReservationComplete />} />
            <Route path="/check" element={<ReservationCheck />} />
            <Route path="/reservations/:reservationNumber" element={<ReservationDetail />} />
            <Route path="/cancellation-complete" element={<CancellationComplete />} />
            {/* 注意: LINEのコールバックURLが /callback の場合、バックエンドの /api/line/callback と混同しないように */}
            <Route path="/callback" element={<LineCallback />} />
            <Route path="/login-failed" element={<LoginFailed />} />
            <Route path="/manual" element={<Manual />} />
            <Route path="/confirm-reservation" element={<ConfirmReservation />} />
            <Route path="customers/:customerId/history" element={<LineHistoryPage />} />
            
            {/* --- 管理者向けページのルーティング --- */}
            <Route path="/admin/*" element={<AdminPanel />} />
            <Route path="/register-line/:token" element={<AdminLineRegistration />} />
            <Route path="/admin/callback" element={<AdminLineCallback />} />

            {/* --- どのルートにも一致しなかった場合の404ページ --- */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </Router>
    // ▲▲▲ ここまで修正 ▲▲▲
  );
}

export default App;
