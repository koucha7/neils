// MomoNail/frontend/src/components/ServiceAndReservationPicker.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ページ遷移用
import api from '../api/axiosConfig'; // API通信用のaxiosインスタンス
import DatePicker from 'react-datepicker'; // 日時選択ピッカー
import 'react-datepicker/dist/react-datepicker.css'; // DatePickerのスタイルをインポート
import { format } from 'date-fns'; // 日時フォーマットライブラリ
import axios from 'axios'; // axiosの型（AxiosError）用

// 型定義: DjangoのAPIから返されるJSONの構造に合わせる
interface Salon {
    id: number;
    name: string;
    address: string;
    phone_number: string;
    // 必要に応じて他のサロン情報フィールドを追加
}

interface Service {
    id: number;
    salon: number; // このサービスが属するサロンのID
    name: string;
    price: string; // DjangoのDecimalFieldはJavaScriptでは文字列として扱われることが多い
    duration_minutes: number; // 所要時間（分）
}

const ServiceAndReservationPicker: React.FC = () => {
    const navigate = useNavigate(); // プログラムによるページ遷移を可能にするフック

    // コンポーネントの状態管理
    const [salon, setSalon] = useState<Salon | null>(null); // 取得したサロン情報
    const [services, setServices] = useState<Service[]>([]); // 取得したサービス一覧
    const [loading, setLoading] = useState<boolean>(true); // データ読み込み中かどうかの状態
    const [error, setError] = useState<string | null>(null); // エラーメッセージ

    const [selectedService, setSelectedService] = useState<Service | null>(null); // ユーザーが選択したサービス
    const [selectedDate, setSelectedDate] = useState<Date | null>(null); // ユーザーが選択した日時
    const [customerName, setCustomerName] = useState<string>(''); // 顧客名入力
    const [customerPhone, setCustomerPhone] = useState<string>(''); // 電話番号入力
    const [customerEmail, setCustomerEmail] = useState<string>(''); // メールアドレス入力
    const [submitting, setSubmitting] = useState<boolean>(false); // フォーム送信中かどうかの状態

    // コンポーネントがマウントされた際に、初期データを取得する副作用フック
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // サロンが1つしかないため、`/salons/` エンドポイントから全てのサロンを取得し、
                // 最初の要素（唯一のサロン）を使用します。
                const salonResponse = await api.get<Salon[]>('/salons/');
                if (salonResponse.data.length > 0) {
                    const singleSalon = salonResponse.data[0]; // 最初のサロンを取得
                    setSalon(singleSalon);

                    // そのサロンに紐づくサービス（メニュー）を取得
                    const servicesResponse = await api.get<Service[]>(`/services/?salon=${singleSalon.id}`);
                    setServices(servicesResponse.data);
                } else {
                    // サロン情報がデータベースにない場合のエラーハンドリング
                    setError('サロン情報が見つかりませんでした。管理画面からサロンを登録してください。');
                }
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                setError('初期情報の取得に失敗しました。時間をおいてお試しください。');
            } finally {
                setLoading(false); // ローディング状態を解除
            }
        };
        fetchInitialData();
    }, []); // 空の依存配列は、このエフェクトがコンポーネントのマウント時に一度だけ実行されることを意味します

    // フォーム送信時のハンドラー
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // HTMLフォームのデフォルトの送信動作（ページリロード）を抑制

        // 必須入力項目のバリデーション
        if (!selectedDate || !customerName || !customerEmail || !salon || !selectedService) {
            alert('必須項目を全て入力し、サービスと日時を選択してください。');
            return;
        }
        if (submitting) return; // 二重送信防止

        setSubmitting(true); // 送信中状態に設定
        setError(null); // 前回のエラーメッセージをクリア

        try {
            // Django APIに送信する予約データを作成
            const reservationData = {
                salon: salon.id, // 選択したサロンのID
                service: selectedService.id, // 選択したサービスのID
                // 選択した日時をISO 8601形式の文字列にフォーマット
                // DjangoのDateTimeFieldがこの形式を期待します
                start_time: format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss"),
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone,
                // `end_time`, `reservation_number`, `status` はバックエンドで自動的に生成されるため、ここでは送信しない
            };

            // `/reservations/` APIエンドポイントにPOSTリクエストを送信
            const response = await api.post('/reservations/', reservationData);
            console.log('Reservation created successfully:', response.data);

            // 予約が成功したら、予約完了画面に遷移
            // 予約番号をURLパラメータとして渡し、完了画面で表示できるようにします
            navigate(`/reservation-complete/${response.data.reservation_number}`);

        } catch (err) {
            console.error("Failed to create reservation:", err);
            // エラーレスポンスを解析し、ユーザーに分かりやすいメッセージを表示
            if (axios.isAxiosError(err) && err.response) {
                // Django REST Frameworkのバリデーションエラーなど、詳細なエラー情報を表示
                setError(`予約作成に失敗しました: ${JSON.stringify(err.response.data)}`);
            } else {
                setError('予約作成中に不明なエラーが発生しました。時間をおいてお試しください。');
            }
        } finally {
            setSubmitting(false); // 送信状態を解除
        }
    };

    // UIのレンダリング
    // ローディング中、エラー時、サロン情報がない場合の表示
    if (loading) return <p className="text-center text-gray-600 text-lg py-10">情報を読み込み中...</p>;
    if (error) return <p className="text-center text-red-500 text-lg py-10 font-semibold">エラー: {error}</p>;
    if (!salon) return <p className="text-center text-gray-600 text-lg py-10">サロン情報が見つかりません。管理画面からサロンを登録してください。</p>;

    return (
        <div className="container mx-auto p-6 bg-white rounded-lg shadow-xl mt-10">
            {/* サロンの基本情報表示 */}
            <h2 className="text-4xl font-extrabold text-blue-800 mb-8 text-center">{salon.name}</h2>
            <p className="text-gray-700 text-lg mb-2 text-center">住所: {salon.address}</p>
            <p className="text-gray-700 text-lg mb-6 text-center">電話: {salon.phone_number}</p>

            {/* 提供サービスの一覧表示 */}
            <h3 className="text-3xl font-bold text-gray-800 mb-5">提供サービス</h3>
            {services.length === 0 ? (
                <p className="text-gray-500 text-xl text-center">現在、サービスが登録されていません。管理者にご確認ください。</p>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {services.map(service => (
                        <li
                            key={service.id}
                            className={`p-6 border-2 rounded-lg cursor-pointer transition duration-200 transform hover:scale-102 ${selectedService?.id === service.id ? 'bg-blue-50 border-blue-600 shadow-md' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                            onClick={() => setSelectedService(service)} // クリックでサービスを選択状態にする
                        >
                            <p className="font-semibold text-xl text-gray-800">{service.name}</p>
                            <p className="text-blue-600 text-lg mt-1">{service.price}円</p>
                            <p className="text-gray-600 text-sm">所要時間: {service.duration_minutes}分</p>
                        </li>
                    ))}
                </ul>
            )}

            {/* サービスが選択された場合に予約フォームを表示 */}
            {selectedService && (
                <div className="mt-10 p-8 bg-green-50 rounded-xl border-2 border-green-300 shadow-lg">
                    <h3 className="text-2xl font-bold text-green-700 mb-4 text-center">選択中のサービス:</h3>
                    <p className="text-xl mb-4 text-center">
                        **{selectedService.name}** ({selectedService.price}円 / {selectedService.duration_minutes}分)
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 日時選択フィールド */}
                        <div>
                            <label htmlFor="date-time" className="block text-gray-800 text-lg font-bold mb-2">
                                予約日時選択: <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                id="date-time"
                                selected={selectedDate} // 選択された日付
                                onChange={(date: Date | null) => setSelectedDate(date)} // 日付が変更されたときのハンドラー
                                showTimeSelect // 時刻選択を有効にする
                                dateFormat="yyyy/MM/dd HH:mm" // 表示フォーマット
                                timeIntervals={30} // 時間選択の刻み（30分ごと）
                                minDate={new Date()} // 今日以降の日付のみ選択可能
                                // カレンダーの見た目や動作をカスタマイズするための追加プロパティ
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                placeholderText="予約希望日時を選択してください"
                                required // 必須入力
                            />
                        </div>
                        {/* 顧客名入力フィールド */}
                        <div>
                            <label htmlFor="customer-name" className="block text-gray-800 text-lg font-bold mb-2">
                                お名前: <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="customer-name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                placeholder="山田 太郎"
                            />
                        </div>
                        {/* メールアドレス入力フィールド */}
                        <div>
                            <label htmlFor="customer-email" className="block text-gray-800 text-lg font-bold mb-2">
                                メールアドレス: <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="customer-email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                required
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                placeholder="your.email@example.com"
                            />
                        </div>
                        {/* 電話番号入力フィールド（任意） */}
                        <div>
                            <label htmlFor="customer-phone" className="block text-gray-800 text-lg font-bold mb-2">
                                電話番号 (任意):
                            </label>
                            <input
                                type="tel"
                                id="customer-phone"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                                placeholder="090-XXXX-XXXX"
                            />
                        </div>
                        {/* 送信中の表示とエラーメッセージ */}
                        {submitting && <p className="text-center text-blue-600 text-lg font-semibold mt-4">予約を送信中...</p>}
                        {error && <p className="text-center text-red-500 text-lg font-semibold mt-4">{error}</p>}
                        {/* 予約確定ボタン */}
                        <button
                            type="submit"
                            disabled={submitting} // 送信中はボタンを無効化
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
                        >
                            予約を確定する
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ServiceAndReservationPicker;