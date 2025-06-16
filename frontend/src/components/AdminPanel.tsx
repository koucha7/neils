// frontend/src/components/AdminPanel.tsx (修正版)

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import axios from 'axios';
import { Calendar, Users, Scissors, LogOut, Bell, Shield, PlusCircle, Edit, Trash2, Menu as MenuIcon, X, BarChart3 } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { useNavigate } from 'react-router-dom';
import StatisticsPanel from './StatisticsPanel';

registerLocale('ja', ja);

// --- 型定義 ---
interface Service { id: number; salon: number; name: string; price: string; duration_minutes: number; }
interface Reservation { id: number; reservation_number: string; customer_name: string; start_time: string; status: string; service: { name: string; } }
interface NotificationSettings { id: number; unconfirmed_reminder_enabled: boolean; unconfirmed_reminder_days_before: number; schedule_reminder_enabled: boolean; schedule_reminder_days_before: number; }
// ★エラー修正: 不要なWeeklySchedule, DateScheduleの型定義を削除
interface ScheduleInfo {
  id?: number;
  status: 'HOLIDAY' | 'SPECIAL_WORKING' | 'DEFAULT_WORKING' | 'DEFAULT_HOLIDAY' | 'UNDEFINED';
  start_time?: string;
  end_time?: string;
}

// --- 各管理画面コンポーネント ---

// 1. メニュー管理
const MenuManagement: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
    const DURATION_CHOICES = [30, 60, 90, 120, 150, 180, 210, 240];
    
    // ★エラー修正: MenuManagement内にあった不要なstate宣言を削除
    // const [monthlySchedules, setMonthlySchedules] = useState<Record<string, ScheduleInfo>>({});
    // const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/services/');
            setServices(response.data);
        } catch (err) {
            setError('メニューの読み込みに失敗しました。');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    const handleSave = async (serviceToSave: Partial<Service>) => {
        const payload = { ...serviceToSave, salon: 1 };
        try {
            if ('id' in serviceToSave && serviceToSave.id) {
                await api.patch(`/services/${serviceToSave.id}/`, payload);
            } else {
                await api.post('/services/', payload);
            }
            setEditingService(null);
            fetchServices();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) { alert(`保存に失敗しました: ${JSON.stringify(err.response.data)}`); } else { alert('保存中に不明なエラーが発生しました。'); }
        }
    };
    
    // (MenuManagementの他の部分は変更なし)
    const handleDelete = async (id: number) => { if (!window.confirm("このメニューを削除しますか？")) return; try { await api.delete(`/services/${id}/`); fetchServices(); } catch (error) { alert('削除に失敗しました。'); } };
    const ServiceForm = ({ service, onSave, onCancel }: { service: Partial<Service>, onSave: (s: Partial<Service>) => void, onCancel: () => void }) => { const [formData, setFormData] = useState(service); const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); }; const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); }; return ( <form onSubmit={handleSubmit} className="bg-gray-50 p-4 my-4 rounded-lg shadow space-y-4"> <h3 className="text-lg font-semibold">{'id' in service && service.id ? 'メニュー編集' : '新規メニュー追加'}</h3> <div> <label className="block text-sm font-medium">メニュー名</label> <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="w-full p-2 border rounded" /> </div> <div> <label className="block text-sm font-medium">料金 (円)</label> <input type="number" name="price" value={formData.price || ''} onChange={handleChange} required className="w-full p-2 border rounded" /> </div> <div> <label className="block text-sm font-medium">所要時間</label> <select name="duration_minutes" value={formData.duration_minutes || 30} onChange={handleChange} required className="w-full p-2 border rounded bg-white">{DURATION_CHOICES.map(d => <option key={d} value={d}>{d} 分</option>)}</select> </div> <div className="flex justify-end space-x-2"> <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded">キャンセル</button> <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">保存</button> </div> </form> ); };
    if (loading) return <p>読み込み中...</p>; if (error) return <p className="text-red-500">{error}</p>;
    return ( <div> <div className="flex justify-between items-center mb-6"> <h2 className="text-2xl font-bold">メニュー管理</h2> <button onClick={() => setEditingService({ name: '', price: '0', duration_minutes: 90 })} className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"> <PlusCircle size={20} className="mr-2" /> 新規追加</button> </div> {editingService && <ServiceForm service={editingService} onSave={handleSave} onCancel={() => setEditingService(null)} />} <div className="bg-white p-4 rounded-lg shadow"> <table className="w-full text-sm"> <thead> <tr className="border-b"> <th className="text-left p-2">メニュー名</th> <th className="text-left p-2">料金</th> <th className="text-left p-2">所要時間(分)</th> <th className="text-left p-2">操作</th> </tr> </thead> <tbody> {services.map(service => (<tr key={service.id} className="border-b hover:bg-gray-50"> <td className="p-2">{service.name}</td> <td className="p-2">{parseInt(service.price).toLocaleString()}円</td> <td className="p-2">{service.duration_minutes}</td> <td className="p-2 space-x-2"> <button onClick={() => setEditingService(service)} className="text-blue-500 hover:text-blue-700"> <Edit size={18} /> </button> <button onClick={() => handleDelete(service.id)} className="text-red-500 hover:text-red-700"> <Trash2 size={18} /> </button> </td> </tr>))} </tbody> </table> </div> </div> );
};

// 2. 新しい勤怠管理コンポーネント
const AttendanceManagement: React.FC = () => {
    const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date());
    const [monthlySchedules, setMonthlySchedules] = useState<Record<string, ScheduleInfo>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<{ date: Date; info: ScheduleInfo | null }>({ date: new Date(), info: null });
    const [modalStatus, setModalStatus] = useState<'working' | 'holiday'>('working');
    const [modalStartTime, setModalStartTime] = useState('10:00');
    const [modalEndTime, setModalEndTime] = useState('19:00');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchMonthlySchedules = useCallback(async (date: Date) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/admin/monthly-schedules/', { params: { year: date.getFullYear(), month: date.getMonth() + 1, }, });
            setMonthlySchedules(response.data);
        } catch (err) {
            setError('スケジュール情報の取得に失敗しました。');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchMonthlySchedules(currentDisplayDate); }, [currentDisplayDate, fetchMonthlySchedules]);

    const handleDateClick = (date: Date | null) => { // ★エラー修正: dateの型を Date | null に変更
        if (!date) return; // ★エラー修正: dateがnullの場合は何もしない
        const dateStr = format(date, 'yyyy-MM-dd');
        const scheduleInfo = monthlySchedules[dateStr] || null;
        setSelectedSchedule({ date, info: scheduleInfo });
        if (scheduleInfo?.status === 'HOLIDAY') {
            setModalStatus('holiday');
        } else {
            setModalStatus('working');
            const startTime = scheduleInfo?.start_time || '10:00';
            const endTime = scheduleInfo?.end_time || '19:00';
            setModalStartTime(startTime);
            setModalEndTime(endTime);
        }
        setIsModalOpen(true);
    };

    const getDayClassName = (date: Date): string => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const schedule = monthlySchedules[dateStr];
        if (!schedule) return '';
        if (schedule.status === 'HOLIDAY') return 'react-datepicker__day--holiday';
        if (schedule.status === 'SPECIAL_WORKING') return 'react-datepicker__day--special-working';
        if (schedule.status === 'DEFAULT_HOLIDAY') return 'react-datepicker__day--default-holiday';
        return '';
    };

    const handleSaveSchedule = async () => {
        setIsSubmitting(true);
        const dateStr = format(selectedSchedule.date, 'yyyy-MM-dd');
        const scheduleId = selectedSchedule.info?.id;
        const requestData = { salon: 1, date: dateStr, is_holiday: modalStatus === 'holiday', start_time: modalStatus === 'working' ? modalStartTime : '09:00', end_time: modalStatus === 'working' ? modalEndTime : '17:00', };
        try {
            if (scheduleId) { await api.put(`/date-schedules/${scheduleId}/`, requestData); } else { await api.post('/date-schedules/', requestData); }
            await fetchMonthlySchedules(currentDisplayDate);
            setIsModalOpen(false);
        } catch (err) {
            alert('設定の保存に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSchedule = async () => {
        const scheduleId = selectedSchedule.info?.id;
        if (!scheduleId || !window.confirm('この日の特別設定を削除しますか？')) return;
        setIsSubmitting(true);
        try {
            await api.delete(`/date-schedules/${scheduleId}/`);
            await fetchMonthlySchedules(currentDisplayDate);
            setIsModalOpen(false);
        } catch (err) {
            alert('設定の削除に失敗しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">勤怠設定</h2>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <p className="text-gray-600 mb-4">カレンダーの日付をクリックして、その日の勤怠（特別営業時間または休日）を設定します。</p>
                <div className="flex justify-center">
                    {loading ? <p>カレンダーを読み込み中...</p> : error ? <p className="text-red-500">{error}</p> : (
                        <DatePicker selected={null} onChange={handleDateClick} onMonthChange={(date) => setCurrentDisplayDate(date)} inline locale="ja" dayClassName={getDayClassName} />
                    )}
                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h4 className="text-lg font-bold mb-4">{format(selectedSchedule.date, 'yyyy年 M月 d日')} の設定</h4>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">種別</label>
                            <div className="flex gap-4">
                                <label className="flex items-center"><input type="radio" value="working" checked={modalStatus === 'working'} onChange={() => setModalStatus('working')} className="form-radio" /><span className="ml-2">出勤</span></label>
                                <label className="flex items-center"><input type="radio" value="holiday" checked={modalStatus === 'holiday'} onChange={() => setModalStatus('holiday')} className="form-radio" /><span className="ml-2">休日</span></label>
                            </div>
                        </div>
                        {modalStatus === 'working' && (
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div><label htmlFor="start-time" className="block text-sm font-medium text-gray-700">開始時刻</label><input type="time" id="start-time" value={modalStartTime} onChange={(e) => setModalStartTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                                <div><label htmlFor="end-time" className="block text-sm font-medium text-gray-700">終了時刻</label><input type="time" id="end-time" value={modalEndTime} onChange={(e) => setModalEndTime(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <button onClick={handleSaveSchedule} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-blue-300">{isSubmitting ? '保存中...' : 'この内容で保存'}</button>
                            {selectedSchedule.info?.id && (<button onClick={handleDeleteSchedule} disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-red-300">設定を削除</button>)}
                            <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md mt-2">キャンセル</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// 3. 予約一覧 (変更なし)
const ReservationList: React.FC = () => { /* ... 元のReservationListのコード ... */ };
// 4. 通知設定 (変更なし)
const NotificationSettingsManagement: React.FC = () => { /* ... 元のNotificationSettingsManagementのコード ... */ };
// 5. キャンセルポリシー設定 (変更なし)
const CancellationPolicyManagement: React.FC = () => { /* ... 元のCancellationPolicyManagementのコード ... */ };
// 6. ログイン画面 (変更なし)
const LoginScreen: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => { /* ... 元のLoginScreenのコード ... */ };


// --- メインコンポーネント ---
const AdminPanel: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
    const [page, setPage] = useState<'reservations' | 'schedule' | 'menu' | 'settings' | 'policy' | 'statistics'>('reservations');
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 640);

    useEffect(() => { localStorage.setItem('isLoggedIn', String(isLoggedIn)); }, [isLoggedIn]);

    const toggleSidebar = useCallback(() => { setIsSidebarOpen(prev => !prev); }, []);

    const renderPage = () => {
        switch (page) {
            case 'reservations': return <ReservationList />;
            case 'schedule': return <AttendanceManagement />; // ★ここを変更
            case 'menu': return <MenuManagement />;
            case 'settings': return <NotificationSettingsManagement />;
            case 'policy': return <CancellationPolicyManagement />;
            case 'statistics': return <StatisticsPanel />;
            default: return <ReservationList />;
        }
    };

    const handleLoginSuccess = () => setIsLoggedIn(true);
    const handleLogout = () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); setIsLoggedIn(false); };

    if (!isLoggedIn) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <aside className={`w-64 bg-gray-800 text-white flex-col ${isSidebarOpen ? 'flex' : 'hidden sm:flex'}`}>
                <div className="p-4 text-2xl font-bold border-b border-gray-700">NailMomo</div>
                <nav className="flex-1 p-2 space-y-1">
                    <button onClick={() => { setPage('reservations'); setIsSidebarOpen(false); }} className={`w-full text-left flex items-center px-4 py-2 rounded-md ${page === 'reservations' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><Users className="mr-3" size={20} /> 予約確認</button>
                    <button onClick={() => { setPage('schedule'); setIsSidebarOpen(false); }} className={`w-full text-left flex items-center px-4 py-2 rounded-md ${page === 'schedule' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><Calendar className="mr-3" size={20} /> 勤怠設定</button>
                    <button onClick={() => { setPage('menu'); setIsSidebarOpen(false); }} className={`w-full text-left flex items-center px-4 py-2 rounded-md ${page === 'menu' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><Scissors className="mr-3" size={20} /> メニュー管理</button>
                    <button onClick={() => { setPage('settings'); setIsSidebarOpen(false); }} className={`w-full text-left flex items-center px-4 py-2 rounded-md ${page === 'settings' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><Bell className="mr-3" size={20} /> 通知設定</button>
                    <button onClick={() => { setPage('policy'); setIsSidebarOpen(false); }} className={`w-full text-left flex items-center px-4 py-2 rounded-md ${page === 'policy' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><Shield className="mr-3" size={20} /> キャンセルポリシー</button>
                    <button onClick={() => { setPage('statistics'); }} className={`w-full text-left flex items-center px-4 py-2 rounded-md ${page === 'statistics' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}><BarChart3 className="mr-3" size={20} /> 統計</button>
                </nav>
                <div className="p-2 border-t border-gray-700"><button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 rounded-md hover:bg-gray-700"><LogOut className="mr-3" size={20} /> ログアウト</button></div>
            </aside>
            <main className="flex-1 p-8">
                <button onClick={toggleSidebar} className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md shadow-lg">{isSidebarOpen ? <X size={24} /> : <MenuIcon size={24} />}</button>
                <div className={`${isSidebarOpen ? 'sm:ml-0' : 'sm:ml-0'}`}>{renderPage()}</div>
            </main>
        </div>
    );
};

export default AdminPanel;