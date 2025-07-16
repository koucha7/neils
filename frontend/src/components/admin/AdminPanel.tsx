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
  const { isLoggedIn, logout } = useAdminAuth();
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
  
  // ★ 4. サイドバーのメニュー定義を修正（ページ切り替えStateは不要に）
  const menuItems = [
    { to: "/admin/reservations", label: "予約確認", icon: ClipboardList },
    { to: "/admin/schedule", label: "受付時間設定", icon: Calendar },
    { to: "/admin/customers", label: "顧客管理", icon: Users },
    { to: "/admin/line-history", label: "LINE履歴", icon: Mail },
    { to: "/admin/menu", label: "メニュー管理", icon: Scissors },
    { to: "/admin/users", label: "ユーザー管理", icon: Users },
    { to: "/admin/statistics", label: "統計", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <aside
        className={`w-64 bg-gray-800 text-white flex-col transition-all duration-300 ${
          isSidebarOpen ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          NailMomo
        </div>
        <nav className="flex-1 p-2 space-y-1">
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
        <div className="p-2 border-t border-gray-700">
          <button onClick={logout} className="w-full text-left flex items-center px-4 py-2 rounded-md hover:bg-gray-700">
            <LogOut className="mr-3" size={20} /> ログアウト
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8">
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md shadow-lg"
        >
          {isSidebarOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
        
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
      </main>
    </div>
  );
};

export default AdminPanel;