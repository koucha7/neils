// MomoNail/frontend/src/components/ReservationDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { format } from 'date-fns';
import ja from 'date-fns/locale/ja'; // 日本語ロケール用
import { ArrowLeft } from 'lucide-react'; // 戻るアイコン

interface Reservation {
    id: number;
    reservation_number: string;
    customer_name: string;
    customer_phone: string | null;
    customer_email: string;
    start_time: string;
    end_time: string;
    status: string;
    service: {
        name: string;
        price: string;
        duration_minutes: number;
    };
    salon: {
        name: string;
    };
}

const ReservationDetail: React.FC = () => {
    const { reservationNumber } = useParams<{ reservationNumber: string }>(); // URLから予約番号を取得
    const navigate = useNavigate();
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReservationDetail = async () => {
            if (!reservationNumber) {
                setError("予約番号が指定されていません。");
                setLoading(false);
                return;
            }
            try {
                const response = await api.get<Reservation>(`/reservations/${reservationNumber}/`);
                setReservation(response.data);
            } catch (err) {
                console.error("Failed to fetch reservation details:", err);
                setError("予約詳細の読み込みに失敗しました。");
            } finally {
                setLoading(false);
            }
        };
        fetchReservationDetail();
    }, [reservationNumber]); // 予約番号が変わったら再フェッチ

    const formatDateTime = (isoString: string) => {
        return format(new Date(isoString), 'yyyy年MM月dd日 HH:mm', { locale: ja });
    };

    if (loading) return <p>読み込み中...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!reservation) return <p>予約が見つかりません。</p>;

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-6">
                    <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800 mr-4">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800">予約詳細</h2>
                </div>

                <div className="space-y-4 text-gray-700">
                    <p><strong>予約ID:</strong> {reservation.reservation_number}</p>
                    <p><strong>サロン名:</strong> {reservation.salon.name}</p>
                    <p><strong>サービス名:</strong> {reservation.service.name}</p>
                    <p><strong>料金:</strong> {parseInt(reservation.service.price).toLocaleString()}円</p>
                    <p><strong>所要時間:</strong> {reservation.service.duration_minutes}分</p>
                    <p><strong>開始日時:</strong> {formatDateTime(reservation.start_time)}</p>
                    <p><strong>終了日時:</strong> {formatDateTime(reservation.end_time)}</p>
                    <p><strong>顧客名:</strong> {reservation.customer_name}</p>
                    <p><strong>メールアドレス:</strong> {reservation.customer_email}</p>
                    <p><strong>電話番号:</strong> {reservation.customer_phone || 'なし'}</p>
                    <p><strong>ステータス:</strong> 
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${reservation.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : reservation.status === 'confirmed' ? 'bg-green-200 text-green-800' : reservation.status === 'cancelled' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
                            {reservation.status}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReservationDetail;