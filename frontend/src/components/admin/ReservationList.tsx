import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import api from '../../api/axiosConfig';

registerLocale("ja", ja);

interface Reservation {
  id: number;
  reservation_number: string;
  customer_name: string;
  start_time: string;
  status: string;
  service: { name: string };
}

const ReservationList: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const navigate = useNavigate();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([ "confirmed", "pending" ]);

  const allStatuses = [
    { value: "pending", label: "保留中" },
    { value: "confirmed", label: "確定済み" },
    { value: "cancelled", label: "キャンセル済み" },
    { value: "completed", label: "完了済み" },
  ];

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("end_date", format(endDate, "yyyy-MM-dd"));
      if (selectedStatuses.length > 0) {
        selectedStatuses.forEach((status) => params.append("status", status));
      }
      
      const response = await api.get('/api/admin/reservations/', { params });
      const sorted = response.data.sort(
        (a: Reservation, b: Reservation) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
      setReservations(sorted);
    } catch (err) {
      setError("予約の読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedStatuses]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleStatusChange = (statusValue: string) => {
    setSelectedStatuses((prev) => 
      prev.includes(statusValue) 
        ? prev.filter((s) => s !== statusValue)
        : [...prev, statusValue]
    );
  };
  
  const handleConfirm = async (reservationNumber: string) => {
    if (!window.confirm(`${reservationNumber} の予約を確定しますか？`)) return;
    try {
      await api.post(`/api/reservations/${reservationNumber}/confirm/`);
      await fetchReservations();
    } catch (err) {
      alert("予約の確定処理中にエラーが発生しました。");
    }
  };

  const handleCancel = async (reservationNumber: string) => {
    if (!window.confirm(`${reservationNumber} の予約をキャンセルしますか？`)) return;
    try {
      await api.post(`/api/reservations/${reservationNumber}/cancel/`);
      await fetchReservations();
    } catch (err) {
      alert("予約のキャンセル処理中にエラーが発生しました。");
    }
  };

  const handleRowClick = (reservationNumber: string) => {
    navigate(`/api/admin/reservations/${reservationNumber}`);
  };
  
  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
        <h2 className="text-2xl font-bold mb-4">予約一覧</h2>
        {/* Filtering UI */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-2">日付範囲で絞り込む</h3>
            <div className="flex items-center space-x-2">
                <DatePicker selected={startDate} onChange={date => setStartDate(date)} dateFormat="yyyy/MM/dd" placeholderText="開始日を選択" className="p-2 border rounded-md" isClearable locale="ja" selectsStart startDate={startDate} endDate={endDate} />
                <DatePicker selected={endDate} onChange={date => setEndDate(date)} dateFormat="yyyy/MM/dd" placeholderText="終了日を選択" className="p-2 border rounded-md" isClearable locale="ja" selectsEnd startDate={startDate} endDate={endDate} minDate={startDate || undefined} />
            </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-2">ステータスで絞り込む</h3>
            <div className="flex flex-wrap items-center space-x-4">
            {allStatuses.map(statusOption => (
                <label key={statusOption.value} className="inline-flex items-center">
                    <input type="checkbox" value={statusOption.value} checked={selectedStatuses.includes(statusOption.value)} onChange={() => handleStatusChange(statusOption.value)} className="form-checkbox h-5 w-5 text-blue-600" />
                    <span className="ml-2 text-gray-700">{statusOption.label}</span>
                </label>
            ))}
            </div>
        </div>
        {/* Reservation Table */}
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="overflow-x-auto">
                <table className="min-w-full leading-normal">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">予約日時</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">顧客名</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">メニュー</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ステータス</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">アクション</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {reservations.map(r => (
                            <tr key={r.id} onClick={() => handleRowClick(r.reservation_number)} className="cursor-pointer hover:bg-gray-100">
                                <td className="px-5 py-5 border-b border-gray-200 bg-white">{new Date(r.start_time).toLocaleString('ja-JP')}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white">{r.customer_name}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white">{r.service.name}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white">
                                    <span className={`px-2 py-1 font-semibold leading-tight text-xs rounded-full ${ r.status === 'confirmed' ? 'bg-green-200 text-green-900' : r.status === 'pending' ? 'bg-yellow-200 text-yellow-900' : 'bg-red-200 text-red-900' }`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white" onClick={(e) => e.stopPropagation()}>
                                    {r.status === 'pending' && <button onClick={() => handleConfirm(r.reservation_number)} className="text-green-600 hover:text-green-900">確定</button>}
                                    {(r.status === 'pending' || r.status === 'confirmed') && <button onClick={() => handleCancel(r.reservation_number)} className="text-red-600 hover:text-red-900 ml-2">取消</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default ReservationList;

