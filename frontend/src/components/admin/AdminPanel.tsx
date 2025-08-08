// frontend/src/components/admin/AdminPanel.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom'; // ★ 1. 必要なフックを追加
import {
  BarChart3, Calendar, LogOut, Menu as MenuIcon, Scissors, Users, X, ClipboardList, Mail
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import LoginScreen from './LoginScreen';
import ReservationList from './ReservationList';
import AttendanceManagement from './AttendanceManagement';
import MenuManagement from './MenuManagement';
import StatisticsPanel from './StatisticsPanel';
import UserManagement from './UserManagement';
import AdminReservationDetail from './AdminReservationDetail';
import CustomerManagement from './CustomerManagement';
import AdminCustomerDetail from './CustomerDetail';
import CustomerMemo from './CustomerMemo';
import SendLineMessage from './SendLineMessage';
import AdminUserDetail from './AdminUserDetail';
import AdminUserCreate from './AdminUserCreate.tsx';
import LineHistoryPage from './LineHistoryPage';
import api from '../../api/axiosConfig';

const AdminPanel: React.FC = () => {
  const { isLoggedIn, logout, user } = useAdminAuth();
  const location = useLocation(); // ★ 3. 現在のパスを取得するためのフック
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      try {
        // バックエンドに作成した認証チェックAPIを呼び出す
        await api.get('/api/admin/me/');
        console.log("セッションは有効です。");
      } catch (error: any) {
        // 401エラーが返ってきたらセッション切れと判断
        if (error.response?.status === 401) {
          console.log("セッションが切れました。自動ログアウトします。");
          alert("セッションが切れました。再度ログインしてください。");
          logout();
        }
      }
    };

    // ログイン中の場合のみ、ページ遷移のたびにチェックを実行
    if (isLoggedIn) {
      verifySession();
    }
  }, [isLoggedIn, logout, location.pathname]); // ★ location.pathnameを監視

  if (!isLoggedIn) {
    return <LoginScreen />;
  }
  
  // デバッグ: user情報を確認
  console.log('AdminPanel user:', user);
  // ★ 4. サイドバーのメニュー定義を修正（ページ切り替えStateは不要に）
  // 権限によってメニューを分岐
  const menuItems = user && user.is_superuser
    ? [
        { to: "/admin/reservations", label: "予約確認", icon: ClipboardList },
        { to: "/admin/schedule", label: "受付時間設定", icon: Calendar },
        { to: "/admin/customers", label: "顧客管理", icon: Users },
        { to: "/admin/line-history", label: "LINE履歴", icon: Mail },
        { to: "/admin/menu", label: "メニュー管理", icon: Scissors },
        { to: "/admin/users", label: "社員管理", icon: Users },
        { to: "/admin/statistics", label: "統計", icon: BarChart3 },
      ]
    : [
        { to: "/admin/reservations", label: "予約確認", icon: ClipboardList },
        { to: "/admin/schedule", label: "受付時間設定", icon: Calendar },
        { to: "/admin/customers", label: "顧客管理", icon: Users },
        { to: "/admin/line-history", label: "LINE履歴", icon: Mail },
        { to: "/admin/menu", label: "メニュー管理", icon: Scissors },
      ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans overflow-hidden">
      {/* ヘッダー */}
      <header className="md:hidden bg-white shadow-sm border-b border-gray-200 z-40 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            {isSidebarOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-900">JELLO</h1>
          <div className="w-10"></div> {/* スペーサー */}
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* オーバーレイ（モバイル時のサイドバー背景） */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <aside
          className={`
            w-64 bg-gray-800 text-white flex flex-col transition-all duration-300 z-40
            md:relative md:translate-x-0
            ${isSidebarOpen 
              ? "fixed left-0 top-0 h-full translate-x-0" 
              : "fixed left-0 top-0 h-full -translate-x-full md:flex"
            }
          `}
        >
          <div className="p-4 text-lg font-bold border-b border-gray-700 flex-shrink-0">
            JELLO
          </div>
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {menuItems.map(item => (
              // ★ 5. buttonをLinkコンポーネントに変更し、URLで遷移させる
              <Link
                key={item.to}
                to={item.to}
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                className={`w-full text-left flex items-center px-4 py-2 rounded-md transition-colors ${
                  // 現在のURLがメニューのパスで始まるかでアクティブ状態を判断
                  location.pathname.startsWith(item.to) ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
              >
                <item.icon className="mr-3" size={20} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-2 border-t border-gray-700 flex-shrink-0">
            <button onClick={logout} className="w-full text-left flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
              <LogOut className="mr-3" size={20} /> ログアウト
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-8">
            <Routes>
              <Route path="/" element={<ReservationList />} />
              <Route path="reservations" element={<ReservationList />} />
              <Route path="reservations/:reservationNumber" element={<AdminReservationDetail />} />
              <Route path="schedule" element={<AttendanceManagement />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="statistics" element={<StatisticsPanel />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="customers/:customerId" element={<AdminCustomerDetail />} />
              <Route path="customers/:customerId/memo" element={<CustomerMemo />} />
              <Route path="customers/:customerId/line" element={<SendLineMessage />} />
              <Route path="users/:userId" element={<AdminUserDetail />} />
              <Route path="users/new" element={<AdminUserCreate />} />
              <Route path="line-history" element={<LineHistoryPage />} />
              <Route path="customers/:customerId/history" element={<LineHistoryPage />} />
              <Route path="customers/:customerId/send-message" element={<SendLineMessage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;