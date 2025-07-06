import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ja } from 'date-fns/locale/ja';
import { format } from 'date-fns';
import api from '../../api/axiosConfig';
import { X, Loader2, SlidersHorizontal, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 予約データの型定義
interface Reservation {
  id: number;
  reservation_number: string;
  customer_name: string;
  service_name: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

// ステータス表示用のコンポーネント
const StatusBadge: React.FC<{ status: Reservation['status'] }> = ({ status }) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-600',
    completed: 'bg-blue-100 text-blue-800',
  };
  const statusLabels = {
    pending: '保留中',
    confirmed: '確定済み',
    cancelled: 'キャンセル済み',
    completed: '完了済み',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
};


const ReservationList: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- フィルター用のState ---
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilters, setStatusFilters] = useState({
    pending: true,
    confirmed: true,
    cancelled: false,
    completed: false,
  });
  // ▼▼▼ フィルターの表示状態を管理するStateを追加 ▼▼▼
  const [isFilterOpen, setIsFilterOpen] = useState(false);


  // 予約データを取得する関数
  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeStatuses = Object.entries(statusFilters)
        .filter(([, isActive]) => isActive)
        .map(([status]) => status);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', format(startDate, 'yyyy-MM-dd'));
      if (endDate) params.append('end_date', format(endDate, 'yyyy-MM-dd'));
      activeStatuses.forEach(status => params.append('status', status));

      const response = await api.get(`/api/admin/reservations/?${params.toString()}`);
      setReservations(response.data);
    } catch (err) {
      setError('予約情報の取得に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, statusFilters]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setStatusFilters(prev => ({ ...prev, [name]: checked }));
  };
  
  const clearDateFilters = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleRowClick = (reservationNumber: string) => {
    navigate(`/admin/reservations/${reservationNumber}`);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* ▼▼▼【ここからが修正箇所】▼▼▼ */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">予約一覧</h1>
        {/* フィルターの表示/非表示を切り替えるボタン */}
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
        >
          {isFilterOpen ? <ChevronUp size={16} /> : <SlidersHorizontal size={16} />}
          <span>フィルター</span>
        </button>
      </div>

      {/* フィルターセクション（isFilterOpenの状態に応じて表示を切り替え） */}
      <div className={`${isFilterOpen ? 'block' : 'hidden'} transition-all duration-300`}>
        {/* sm以上の画面では横並び(flex-row)、それ未満では縦並び(flex-col)にする */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 日付フィルター */}
          <div className="p-4 bg-white rounded-lg shadow-sm flex-1">
            <h3 className="font-semibold text-gray-700 mb-2">日付範囲で絞り込み</h3>
            {/* sm未満では縦並び(flex-col)、sm以上で横並び(flex-row)にする */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="yyyy/MM/dd"
                locale={ja}
                className="w-full p-2 border rounded-md"
                placeholderText="開始日"
              />
              <span className="text-gray-500 text-center sm:text-left">〜</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                // startDateがnullの場合にundefinedを渡すように修正
                minDate={startDate || undefined}
                dateFormat="yyyy/MM/dd"
                locale={ja}
                className="w-full p-2 border rounded-md"
                placeholderText="終了日"
              />
              <button onClick={clearDateFilters} className="p-2 text-gray-500 hover:text-gray-700 self-center sm:self-auto">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ステータスフィルター */}
          <div className="p-4 bg-white rounded-lg shadow-sm flex-1">
            <h3 className="font-semibold text-gray-700 mb-2">ステータスで絞り込み</h3>
            {/* sm未満では2列のグリッド、sm以上で横並びにする */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-2">
              {Object.entries(statusFilters).map(([status, checked]) => (
                <label key={status} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={status}
                    checked={checked}
                    onChange={handleStatusChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">{({pending: '保留中', confirmed: '確定済み', cancelled: 'キャンセル済み', completed: '完了済み'}[status])}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* スマホ用: カード表示 */}
      <div className="md:hidden space-y-3 mt-4">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            onClick={() => handleRowClick(reservation.reservation_number)}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500 cursor-pointer flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-gray-800">{reservation.customer_name}</p>
              <p className="text-sm text-gray-600">{reservation.service_name}</p>
              <span className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(reservation.status)}`}>
                {reservation.status}
              </span>
            </div>
            {/* ▼▼▼【スマホ用の日付表示を修正】▼▼▼ */}
            <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-gray-500">
                    {format(new Date(reservation.start_time), 'yyyy/MM/dd')}
                </p>
                <p className="text-xl font-bold text-gray-800">
                    {format(new Date(reservation.start_time), 'HH:mm')}
                </p>
            </div>
            {/* ▲▲▲【修正ここまで】▲▲▲ */}
          </div>
        ))}
      </div>

      {/* PC用: テーブル表示 */}
      <div className="hidden md:block overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">予約日時</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">顧客名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メニュー</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reservations.map((reservation) => (
              <tr key={reservation.id} onClick={() => handleRowClick(reservation.reservation_number)} className="hover:bg-gray-100 cursor-pointer">
                {/* ▼▼▼【PC用の日付表示を修正】▼▼▼ */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-500">{format(new Date(reservation.start_time), 'yyyy/MM/dd')}</div>
                    <div className="text-lg font-bold text-gray-900">{format(new Date(reservation.start_time), 'HH:mm')}</div>
                  </div>
                </td>
                {/* ▲▲▲【修正ここまで】▲▲▲ */}
                <td className="px-6 py-4 whitespace-nowrap">{reservation.customer_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{reservation.service_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(reservation.status)}`}>
                    {reservation.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReservationList;
