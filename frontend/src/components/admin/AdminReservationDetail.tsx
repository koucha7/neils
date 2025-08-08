// frontend/src/components/admin/AdminReservationDetail.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { ArrowLeft, Check, X } from 'lucide-react';

interface ReservationDetail {
    id: number;
    reservation_number: string;
    customer_name: string;
    customer_id: number;
    start_time: string;
    end_time: string;
    status: string;
    service_name: string;
}

const AdminReservationDetail: React.FC = () => {
    const { reservationNumber } = useParams<{ reservationNumber: string }>();
    const [reservation, setReservation] = useState<ReservationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // ステータスを日本語に変換する関数
    const getStatusLabel = (status: string): string => {
        switch (status) {
            case 'confirmed':
                return '確定';
            case 'pending':
                return '保留中';
            case 'cancelled':
                return 'キャンセル';
            case 'completed':
                return '完了';
            case 'no_show':
                return '無断欠席';
            default:
                return status;
        }
    };

    const fetchReservation = useCallback(async () => {
        if (!reservationNumber) return;
        try {
            const response = await api.get<ReservationDetail>(`/api/admin/reservations/${reservationNumber}/`);
            setReservation(response.data);
        } catch (err) {
            setError('予約情報の取得に失敗しました。');
        } finally {
            setLoading(false);
        }
    }, [reservationNumber]);

    useEffect(() => {
        fetchReservation();
    }, [fetchReservation]);
    
    const handleConfirm = async () => {
      if (!reservation) return;
      if (!window.confirm("この予約を確定しますか？")) return;
      try {
        await api.post(`/api/admin/reservations/${reservation.reservation_number}/confirm/`);
        await fetchReservation();
      } catch (err) {
        alert("予約の確定処理に失敗しました。");
      }
    };
    
    const handleCancel = async () => {
      if (!reservation) return;
      if (!window.confirm("この予約をキャンセルしますか？")) return;
      try {
        await api.post(`/api/admin/reservations/${reservation.reservation_number}/cancel/`);
        await fetchReservation();
      } catch (err) {
        alert("予約のキャンセル処理に失敗しました。");
      }
    };

    if (loading) return <div className="p-6">読み込み中...</div>;
    if (error) return <div className="p-6 text-red-500">{error}</div>;
    if (!reservation) return <div className="p-6">予約データが見つかりません。</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate('/admin/reservations')} className="p-2 rounded-full hover:bg-gray-100 mr-4">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">予約詳細</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <p><strong>予約番号:</strong> {reservation.reservation_number}</p>
                <p><strong>ステータス:</strong> {getStatusLabel(reservation.status)}</p>
                <div>
                    <strong>顧客名:</strong>
                    <Link 
                        to={`/admin/customers/${reservation.customer_id}`} 
                        className="text-blue-600 hover:underline ml-2"
                    >
                        {reservation.customer_name}
                    </Link>
                </div>
                <p><strong>メニュー:</strong> {reservation.service_name}</p>
                <p><strong>予約日時:</strong> {format(new Date(reservation.start_time), 'yyyy年MM月dd日 HH:mm', { locale: ja })}</p>
            </div>
            
            <div className="mt-8 pt-6 border-t flex justify-end space-x-3">
                {reservation.status === 'pending' && (
                    <button onClick={handleConfirm} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors">
                        <Check size={18} className="mr-2"/> 確定する
                    </button>
                )}
                {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                     <button onClick={handleCancel} className="flex items-center bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors">
                        <X size={18} className="mr-2"/> キャンセル
                    </button>
                )}
            </div>
        </div>
    );
};

export default AdminReservationDetail;