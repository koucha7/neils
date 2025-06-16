// frontend/src/components/ReservationCheck.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom'; // ★ Linkをインポート

// 予約データの型定義
interface Reservation {
    id: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    start_time: string;
    end_time: string;
    reservation_number: string;
    status: string;
    service: {
        name: string;
        price: string;
    };
}

const statusMap: { [key in Reservation['status']]: string } = {
    pending: '予約確認中',
    confirmed: '予約確定済み',
    cancelled: 'キャンセル済み',
    completed: '完了済み',
};

const ReservationCheck: React.FC = () => {
    const navigate = useNavigate();
    const [reservationNumberInput, setReservationNumberInput] = useState('');
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reservationNumberInput) {
            setError('予約番号を入力してください。');
            return;
        }
        setLoading(true);
        setError(null);
        setReservation(null);

        try {
            // バックエンドAPIに予約番号で問い合わせ
            const response = await api.get(`/reservations/${reservationNumberInput}/`);
            setReservation(response.data);
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setError('指定された予約番号の予約は見つかりませんでした。');
            } else {
                setError('予約の検索中にエラーが発生しました。');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!reservation) return;

        // ユーザーに最終確認
        if (window.confirm('本当にこの予約をキャンセルしますか？\nこの操作は取り消せません。')) {
            setLoading(true);
            setError(null);
            try {
                // バックエンドのキャンセルAPIを呼び出す
                await api.post(`/reservations/${reservation.reservation_number}/cancel/`);
                // キャンセル完了ページに遷移
                navigate('/cancellation-complete');
            } catch (err) {
                setError('キャンセル処理中にエラーが発生しました。時間をおいて再度お試しください。');
                console.error(err);
                setLoading(false);
            }
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">ご予約の確認</h2>
                <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2 mb-6">
                    <input
                        type="text"
                        value={reservationNumberInput}
                        onChange={(e) => setReservationNumberInput(e.target.value.toUpperCase())}
                        placeholder="予約番号を入力"
                        className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md shadow-md transition duration-300 disabled:opacity-50"
                    >
                        {loading ? '検索中...' : '予約を検索'}
                    </button>
                </form>

                {error && <p className="text-center text-red-500 font-semibold">{error}</p>}

                {reservation && (
                    <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200 animate-fade-in">
                        <h3 className="text-xl font-bold text-green-800 mb-4">予約内容</h3>
                        <div className="space-y-2 text-gray-700">
                            <p><strong>予約番号:</strong> <span className="font-mono text-purple-800">{reservation.reservation_number}</span></p>
                            <p><strong>お名前:</strong> {reservation.customer_name}様</p>
                            <p><strong>ステータス:</strong> 
                                <span className={`font-bold ${reservation.status === 'confirmed' ? 'text-green-600' : 'text-gray-800'}`}>
                                    {statusMap[reservation.status]}
                                </span>
                            </p>
                            <p><strong>予約日時:</strong> {format(new Date(reservation.start_time), 'yyyy年MM月dd日 HH:mm')}〜</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-8 text-center">
                <Link to="/" className="text-blue-600 hover:underline">
                    トップページに戻る
                </Link>
            </div>
        </div>
    );
};

export default ReservationCheck;