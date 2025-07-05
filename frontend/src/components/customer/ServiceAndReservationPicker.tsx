import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axiosConfig";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { useAuth } from '../../context/AuthContext';
import SharedCalendar from "../common/SharedCalendar"; // 共通カレンダーをインポート

// --- 型定義 ---
interface Salon {
  id: number;
  name: string;
}
interface Service {
  id: number;
  name: string;
  price: string;
  duration_minutes: number;
}

const ServiceAndReservationPicker: React.FC = () => {
  const { isAuthenticated: isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // State Hooks
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  type Step = "SERVICE" | "DATE" | "TIME" | "DETAILS" | "CONFIRMATION";
  const [currentStep, setCurrentStep] = useState<Step>("SERVICE");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  // --- データ取得ロジック (変更なし) ---
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (isLoggedIn) {
        setIsLoadingCustomer(true);
        try {
          const response = await api.get("/api/me/");
          setCustomerName(response.data.name || "");
          setCustomerEmail(response.data.email || "");
          setCustomerPhone(response.data.phone_number || "");
        } catch (error) {
          console.error("顧客情報の取得に失敗しました:", error);
        } finally {
          setIsLoadingCustomer(false);
        }
      } else {
        setIsLoadingCustomer(false);
      }
    };
    fetchCustomerData();
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const salonResponse = await api.get<Salon[]>("/api/salons/");
        if (salonResponse.data.length > 0) {
          const singleSalon = salonResponse.data[0];
          setSalon(singleSalon);
          const servicesResponse = await api.get<Service[]>(
            `/api/services/?salon=${singleSalon.id}`
          );
          setServices(servicesResponse.data);
        } else {
          setError("サロン情報が見つかりませんでした。");
        }
      } catch (err) {
        setError("初期情報の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- イベントハンドラ ---
  const handleSelectService = useCallback((service: Service) => {
    setSelectedService(service);
    setCurrentStep("DATE");
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableTimeSlots([]);
    setStepError(null);
  }, []);
  
  // ▼▼▼【エラー修正点】日付選択時の処理を修正 ▼▼▼
  const handleDateSelect = useCallback(
    async (date: Date | null) => { // ★ nullを受け取れるように型を修正
      if (!selectedService) return;
      
      // ★ 日付が選択された場合のみAPIを呼び出す
      if (date) {
        setSelectedDate(date);
        setTimeSlotsLoading(true);
        setStepError(null);
        setAvailableTimeSlots([]);

        try {
          const formattedDate = format(date, "yyyy-MM-dd");
          const response = await api.get<string[]>("/api/availability/", {
            params: { date: formattedDate, service_id: selectedService.id },
          });
          if (response.data.length > 0) {
            setAvailableTimeSlots(response.data);
            setCurrentStep("TIME");
          } else {
            setStepError("申し訳ありません。この日は受付可能な時間が設定されていません。");
          }
        } catch (err) {
          setStepError("予約可能な時間の取得に失敗しました。");
          console.error(err);
        } finally {
          setTimeSlotsLoading(false);
        }
      } else {
        // 日付がクリアされた場合（nullが渡された場合）
        setSelectedDate(null);
        setAvailableTimeSlots([]);
        setStepError(null);
      }
    },
    [selectedService]
  );

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
    setCurrentStep("DETAILS");
  }, []);
  
  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) {
      alert("必須項目（お名前とメールアドレス）を入力してください。");
      return;
    }
    setCurrentStep("CONFIRMATION");
  };

  const handleFinalSubmit = useCallback(async () => {
    if (!selectedDate || !selectedTime || !customerName || !customerEmail || !salon || !selectedService) {
      alert("必須項目が不足しています。");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const finalDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    finalDateTime.setHours(hours, minutes, 0, 0);

    try {
      const reservationData = {
        salon: salon.id,
        service: selectedService.id,
        start_time: format(finalDateTime, "yyyy-MM-dd'T'HH:mm:ss"),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      };
      const response = await api.post("/api/reservations/", reservationData);
      navigate(`/reservation-complete/${response.data.reservation_number}`);
    } catch (err: any) {
      console.error("Failed to create reservation:", err);
      setError(`予約作成に失敗しました: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
    }
  }, [customerEmail, customerName, customerPhone, navigate, salon, selectedDate, selectedService, selectedTime, submitting]);
  
  const formatDuration = useCallback((minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      if (m === 30) return `${h}時間半`;
      if (m === 0) return `${h}時間`;
      return `${h}時間${m}分`;
    }
    return `${m}分`;
  }, []);
  
  // --- レンダリング ---
  if (loading || isLoadingCustomer) {
    return <div className="text-center p-10">情報を読み込み中...</div>;
  }
  if (error) {
    return <div className="text-center p-10 text-red-500">エラー: {error}</div>;
  }
  if (!isLoggedIn) {
    return (
      <div className="text-center p-8 border rounded-lg bg-gray-50">
        <p className="text-lg">予約をするには、まずLINEでログインしてください。</p>
        <Link to="/" className="text-blue-600 hover:underline">トップページに戻る</Link>
      </div>
    );
  }
  if (!salon) {
    return <div className="text-center p-10">サロン情報が見つかりません。</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Nail Momo</h2>

        {/* --- ① サービス選択 --- */}
        {currentStep === "SERVICE" && (
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">◎ 1. メニューを選択</h3>
            <div className="space-y-3 mb-8">
              {services.map((service) => (
                <div key={service.id} onClick={() => handleSelectService(service)} className={`flex justify-between items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedService?.id === service.id ? "bg-gray-200 border-gray-400" : "bg-white border-gray-300 hover:bg-gray-100"}`}>
                  <div>
                    <p className="text-lg font-semibold">{service.name}</p>
                    <p className="text-sm text-gray-600">({formatDuration(service.duration_minutes)})</p>
                  </div>
                  <p className="text-lg font-bold">{parseInt(service.price).toLocaleString()}円</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ② 日付選択 --- */}
        {currentStep === "DATE" && selectedService && (
          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">◎ 2. 日付を選択</h3>
              <SharedCalendar 
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                apiEndpoint="/api/bookable-dates/"
                highlightClassName="bookable-date"
                isBookable={true}
              />
              {stepError && <p className="mt-4 text-red-500 font-semibold">{stepError}</p>}
            </div>
            <button onClick={() => setCurrentStep("SERVICE")} className="mt-4 text-blue-600 hover:underline">
              ← サービスの選択に戻る
            </button>
          </div>
        )}

        {/* --- ③ 時間選択 --- */}
        {currentStep === "TIME" && selectedService && selectedDate && (
          <div className="mt-8 pt-6 border-t">
            <div className="p-2 mb-4 bg-gray-100 rounded-md">
              <p className="font-semibold"><span className="text-sm">メニュー:</span> {selectedService.name}</p>
              <p className="font-semibold"><span className="text-sm">日付:</span> {format(selectedDate, "yyyy年MM月dd日")}</p>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">◎ 3. 時間を選択して下さい</h3>
            {timeSlotsLoading ? (
              <p className="text-center text-gray-600">利用可能な時間枠を読み込み中...</p>
            ) : availableTimeSlots.length === 0 ? (
              <p className="text-red-600 text-center">この日付とサービスでは利用可能な時間枠がありません。</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimeSlots.map((time) => (
                  <button key={time} type="button" onClick={() => handleTimeSelect(time)} className="p-2 border rounded-md text-center hover:bg-blue-500 hover:text-white transition-colors">
                    {time}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setCurrentStep("DATE")} className="mt-4 text-blue-600 hover:underline">
              ← 日付の選択に戻る
            </button>
          </div>
        )}

        {/* --- ④ 予約者情報入力 --- */}
        {currentStep === "DETAILS" && selectedService && selectedDate && selectedTime && (
          <div className="mt-8 pt-6 border-t">
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">◎ 4. お客様情報を入力</h3>
              <form onSubmit={handleProceedToConfirmation} className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-md space-y-1">
                  <p><strong>サービス:</strong> {selectedService.name}</p>
                  <p><strong>日時:</strong> {`${format(selectedDate, "yyyy年MM月dd日")} ${selectedTime}`}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">お名前</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full p-2 border rounded mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">電話番号(ハイフンなし)</label>
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-2 border rounded mt-1" />
                </div>
                {submitting && <p className="text-center text-blue-600">予約を送信中...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                <button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50">
                  予約を確定する
                </button>
              </form>
              <button onClick={() => setCurrentStep("TIME")} className="mt-4 text-blue-600 hover:underline">
                ← 時間の選択に戻る
              </button>
            </div>
          </div>
        )}

        {/* --- ⑤ 予約内容確認 --- */}
        {currentStep === "CONFIRMATION" && selectedService && selectedDate && selectedTime && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">◎ 5. ご予約内容の確認</h3>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <h4 className="font-bold text-yellow-800">キャンセルポリシー</h4>
              <p className="text-sm text-yellow-700 mt-1">キャンセルは直接店舗にご連絡ください。</p>
            </div>
            <div className="space-y-3 bg-gray-50 p-4 rounded-md">
              <div><strong className="w-28 inline-block">サービス:</strong> {selectedService.name}</div>
              <div><strong className="w-28 inline-block">料金:</strong> {parseInt(selectedService.price).toLocaleString()}円</div>
              <div><strong className="w-28 inline-block">日時:</strong> {`${format(selectedDate, "yyyy年MM月dd日")} ${selectedTime}`}</div>
              <hr className="my-3" />
              <div><strong className="w-28 inline-block">お名前:</strong> {customerName}</div>
              <div><strong className="w-28 inline-block">メール:</strong> {customerEmail}</div>
              <div><strong className="w-28 inline-block">電話番号:</strong> {customerPhone || "未入力"}</div>
            </div>
            {submitting && <p className="text-center text-blue-600 mt-4">予約を送信中...</p>}
            {error && <p className="text-center text-red-500 mt-4">{error}</p>}
            <div className="mt-6 space-y-3">
              <button onClick={handleFinalSubmit} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50">
                この内容で予約する
              </button>
              <button onClick={() => setCurrentStep("DETAILS")} disabled={submitting} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-300">
                入力内容を修正する
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-calendar-container {
          max-width: 450px; /* PC画面での最大幅を固定 */
          width: 100%;
          margin: 0 auto;
          position: relative; /* 矢印を配置するための基準点にする */
          padding-top: 10px;  /* 上部に余白を追加 */
        }

        /* 2. カレンダー本体のスタイル */
        .custom-calendar-container .react-datepicker {
          width: 100%;
          border: none;
          font-size: 1rem;
          background-color: transparent; /* 背景を透明に */
        }

        /* 3. ヘッダー（月と矢印のエリア）のスタイル */
        .custom-calendar-container .react-datepicker__header {
          background-color: transparent; /* 背景を透明に */
          border-bottom: none;
          padding: 0;
        }

        /* 4. 「7月 2025」のような現在の月の表示スタイル */
        .custom-calendar-container .react-datepicker__current-month {
          font-size: 1.5rem; /* 文字を大きく */
          font-weight: bold;
          padding-bottom: 1rem; /* 曜日との間隔を調整 */
        }

        /* 5. 矢印ナビゲーションの配置 (最重要) */
        .custom-calendar-container .react-datepicker__navigation {
          top: 15px; /* 垂直位置を調整 */
        }
        .custom-calendar-container .react-datepicker__navigation--previous {
          left: 20px; /* 左からの位置を調整 */
        }
        .custom-calendar-container .react-datepicker__navigation--next {
          right: 20px; /* 右からの位置を調整 */
        }

        /* 6. 週の行のレイアウト */
        .custom-calendar-container .react-datepicker__week {
          display: flex;
          justify-content: space-around;
          align-items: center;
        }

        /* 7. 日付と曜日セルのサイズを固定 */
        .custom-calendar-container .react-datepicker__day-name,
        .custom-calendar-container .react-datepicker__day {
          width: 50px;
          height: 50px;
          line-height: 50px;
          margin: 0.1rem;
        }

        /* 8. 日付セルの角を丸める */
        .custom-calendar-container .react-datepicker__day {
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        /* 9. 過去日・範囲外の日付のスタイル */
        .custom-calendar-container .past-date,
        .custom-calendar-container .react-datepicker__day--outside-month {
          color: #ccc;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default ServiceAndReservationPicker;
