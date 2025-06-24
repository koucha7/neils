import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// --- コンポーネントのインポート ---
// 顧客向け
import LandingPage from './components/customer/LandingPage'; // ★ 新しいランディングページをインポート
import ServiceAndReservationPicker from './components/customer/ServiceAndReservationPicker';
import ReservationComplete from './components/customer/ReservationComplete';
import ReservationCheck from './components/customer/ReservationCheck';
import ReservationDetail from './components/customer/ReservationDetail';
import CancellationComplete from './components/customer/CancellationComplete';
import LineCallback from './components/customer/LineCallback';
import LoginFailed from './components/customer/LoginFailed';
import Manual from './components/customer/Manual';

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
    <AuthProvider>
      <Router>
        <Routes>
          {/* --- 顧客向けページのルーティング --- */}
          <Route path="/" element={<LandingPage />} /> {/* ★ ルートをLandingPageに変更 */}
          <Route path="/reserve" element={<ServiceAndReservationPicker />} /> {/* 予約フローの開始パス */}
          <Route path="/reservation-complete/:reservationNumber" element={<ReservationComplete />} />
          <Route path="/check" element={<ReservationCheck />} />
          <Route path="/reservations/:reservationNumber" element={<ReservationDetail />} />
          <Route path="/cancellation-complete" element={<CancellationComplete />} />
          <Route path="/callback" element={<LineCallback />} />
          <Route path="/login-failed" element={<LoginFailed />} />
          <Route path="/manual" element={<Manual />} />
          
          {/* --- 管理者向けページのルーティング --- */}
          <Route path="/admin/*" element={<AdminPanel />} />

          {/* --- どのルートにも一致しなかった場合の404ページ --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
