import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig'; // ★追加: APIクライアントをインポート
import { format } from 'date-fns';
import { ja } from 'date-fns/locale/ja';
import { ArrowLeft } from 'lucide-react'; // 戻るアイコン

// 予約情報の型定義
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
    notes: string;
}

const ReservationDetail: React.FC = () => {
    const { reservationNumber } = useParams<{ reservationNumber: string }>();
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchReservation = useCallback(async () => {
        if (!reservationNumber) {
            setError("予約番号が指定されていません。");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get<Reservation>(`/api/reservations/${reservationNumber}/`);
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

    const formatDateTime = (isoString: string) => {
        return format(new Date(isoString), 'yyyy年MM月dd日 HH:mm', { locale: ja });
    };

    // ★★★ ここから追加 ★★★
    const handleConfirm = async () => {
        if (!reservation) return;
        if (!window.confirm(`${reservation.reservation_number} の予約を確定しますか？`)) return;
        try {
            await api.post(`/api/reservations/${reservation.reservation_number}/confirm/`);
            // 成功したらデータを再取得して画面を更新
            fetchReservation();
        } catch (err) {
            alert('予約の確定処理中にエラーが発生しました。');
        }
    };

    const handleCancel = async () => {
        if (!reservation) return;
        if (!window.confirm(`${reservation.reservation_number} の予約をキャンセルしますか？`)) return;
        try {
            await api.post(`/api/reservations/${reservation.reservation_number}/cancel/`);
            // 成功したらデータを再取得して画面を更新
            fetchReservation();
        } catch (err) {
            alert('予約のキャンセル処理中にエラーが発生しました。');
        }
    };
    // ★★★ ここまで追加 ★★★


    if (loading) return <div className="p-4 sm:p-6">読み込み中...</div>;
    if (error) return <div className="p-4 sm:p-6 text-red-500">{error}</div>;
    if (!reservation) return <div className="p-4 sm:p-6">予約が見つかりません。</div>;


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
                
                {/* ★★★ ここから追加 ★★★ */}
                <div className="mt-8 pt-6 border-t flex items-center justify-end space-x-4">
                    {reservation.status === 'pending' && (
                        <button 
                            onClick={handleConfirm} 
                            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            予約を確定する
                        </button>
                    )}
                    {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                        <button 
                            onClick={handleCancel} 
                            className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            予約をキャンセルする
                        </button>
                    )}
                </div>
                {/* ★★★ ここまで追加 ★★★ */}

            </div>
        </div>
    );
};

export default ReservationDetail;