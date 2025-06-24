import React, { useState, useCallback } from 'react';
import {
  BarChart3, Bell, Calendar, LogOut, Menu as MenuIcon, Scissors, Shield, Users, X
} from 'lucide-react';
import LoginScreen from './LoginScreen';
import ReservationList from './ReservationList';
import AttendanceManagement from './AttendanceManagement';
import MenuManagement from './MenuManagement';
import NotificationSettingsManagement from './NotificationSettingsManagement';
import CancellationPolicyManagement from './CancellationPolicyManagement';
import StatisticsPanel from './StatisticsPanel';

// 表示するページの型定義
type AdminPage = "reservations" | "schedule" | "menu" | "settings" | "policy" | "statistics";

const AdminPanel: React.FC = () => {
  // --- State Hooks ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("adminAccessToken"));
  const [page, setPage] = useState<AdminPage>("reservations");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 640);

  // --- Callbacks ---
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleLoginSuccess = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("adminRefreshToken");
    setIsLoggedIn(false);
  };
  
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
      case "settings": return <NotificationSettingsManagement />;
      case "policy": return <CancellationPolicyManagement />;
      case "statistics": return <StatisticsPanel />;
      default: return <ReservationList />;
    }
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const menuItems: { page: AdminPage; label: string; icon: React.ElementType }[] = [
    { page: "reservations", label: "予約確認", icon: Users },
    { page: "schedule", label: "受付時間設定", icon: Calendar },
    { page: "menu", label: "メニュー管理", icon: Scissors },
    { page: "settings", label: "通知設定", icon: Bell },
    { page: "policy", label: "キャンセルポリシー", icon: Shield },
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
            onClick={handleLogout}
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
