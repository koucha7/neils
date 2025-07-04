import React, { useState, useCallback } from 'react';
import {
  BarChart3, Bell, Calendar, LogOut, Menu as MenuIcon, Scissors, Shield, Users, X, ClipboardList
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext'; // ★ 管理者用Authフックをインポート
import LoginScreen from './LoginScreen';
import ReservationList from './ReservationList';
import AttendanceManagement from './AttendanceManagement';
import MenuManagement from './MenuManagement';
import StatisticsPanel from './StatisticsPanel';
import UserManagement from './UserManagement';

// 表示するページの型定義
type AdminPage = "reservations" | "schedule" | "menu" | "users" | "statistics";

const AdminPanel: React.FC = () => {
  // ▼▼▼ 認証状態をAdminAuthContextから取得するように変更 ▼▼▼
  const { isLoggedIn, logout } = useAdminAuth();
  const [page, setPage] = useState<AdminPage>("reservations");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 640);

  // --- Callbacks ---
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);
  
  const handleSetPage = (selectedPage: AdminPage) => {
    setPage(selectedPage);
    if(window.innerWidth < 640) {
        setIsSidebarOpen(false);
    }
  };

  // --- Render Logic ---
  const renderPage = () => {
    switch (page) {
      case "reservations": return <ReservationList />;
      case "schedule": return <AttendanceManagement />;
      case "menu": return <MenuManagement />;
      case "users": return <UserManagement />;
      case "statistics": return <StatisticsPanel />;
      default: return <ReservationList />;
    }
  };

  // Contextから取得したisLoggedInで判断します
  if (!isLoggedIn) {
    // onLoginSuccessプロパティは不要なので削除します
    return <LoginScreen />;
  }

  const menuItems: { page: AdminPage; label: string; icon: React.ElementType }[] = [
    { page: "reservations", label: "予約確認", icon: ClipboardList },
    { page: "schedule", label: "受付時間設定", icon: Calendar },
    { page: "menu", label: "メニュー管理", icon: Scissors },
    { page: "users", label: "ユーザー管理", icon: Users },
    { page: "statistics", label: "統計", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <aside
        className={`w-64 bg-gray-800 text-white flex-col transition-all duration-300 ${
          isSidebarOpen ? "flex" : "hidden sm:flex"
        }`}
      >
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          NailMomo
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.page}
              onClick={() => handleSetPage(item.page)}
              className={`w-full text-left flex items-center px-4 py-2 rounded-md transition-colors ${
                page === item.page ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              <item.icon className="mr-3" size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-700">
          <button
            onClick={logout}
            className="w-full text-left flex items-center px-4 py-2 rounded-md hover:bg-gray-700"
          >
            <LogOut className="mr-3" size={20} /> ログアウト
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-8">
        <button
          onClick={toggleSidebar}
          className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md shadow-lg"
        >
          {isSidebarOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
        <div className={isSidebarOpen ? "sm:ml-0" : "sm:ml-0"}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;