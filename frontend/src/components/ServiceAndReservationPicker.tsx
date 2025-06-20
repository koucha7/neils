import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axiosConfig";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import axios from "axios";

// react-datepickerを日本語化
registerLocale("ja", ja);

// --- 型定義 ---
interface Salon {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  cancellation_deadline_days: number; // キャンセルポリシーの日数を追加
}
interface Service {
  id: number;
  salon: number;
  name: string;
  price: string;
  duration_minutes: number;
}

const ServiceAndReservationPicker: React.FC = () => {
  // --- 1. 全てのフックをコンポーネントの最上位で定義 ---
  const navigate = useNavigate();

  // State Hooks
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  type Step = "SERVICE" | "DATE" | "TIME" | "DETAILS" | "CONFIRMATION"; // ★ 確認ステップを追加
  const [currentStep, setCurrentStep] = useState<Step>("SERVICE");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [timeSlotsLoading, setTimeSlotsLoading] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookableDates, setBookableDates] = useState<string[]>([]);

  const isBookable = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    // 予約可能日リストに含まれている日付のみtrueを返す
    return bookableDates.includes(formattedDate);
  };

/*   const handleLineLogin = () => {
    const state = "YOUR_RANDOM_STATE_STRING"; // CSRF対策のランダムな文字列
    localStorage.setItem("line_login_state", state);
    
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${import.meta.env.VITE_LINE_LOGIN_CHANNEL_ID}&redirect_uri=${import.meta.env.VITE_LINE_CALLBACK_URL}&state=${state}&scope=openid%20profile%20email`;
    
    window.location.href = lineLoginUrl;
}; */

  // Effect Hook for initial data fetching
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

  useEffect(() => {
    const fetchBookableDates = async () => {
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1; // getMonthは0始まりなので+1
        const response = await api.get("/api/bookable-dates/", {
          params: { year, month },
        });
        setBookableDates(response.data);
      } catch (err) {
        console.error("予約可能日の取得に失敗しました:", err);
        setBookableDates([]);
      }
    };
    fetchBookableDates();
  }, [currentMonth]); // currentMonthが変更されたら再実行

  // Callback Hooks
  const handleSelectService = useCallback((service: Service) => {
    setSelectedService(service);
    setCurrentStep("DATE");
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableTimeSlots([]);
    setStepError(null);
  }, []);

  const handleDateSelect = useCallback(
    async (date: Date | null) => {
      if (!selectedService) return;
      if (!date) {
        // 修正点2: dateがnullの場合の処理を追加
        setStepError("日付を選択してください。");
        return;
      }
      setSelectedDate(date);
      setTimeSlotsLoading(true);
      setStepError(null);
      setAvailableTimeSlots([]);

      try {
        const formattedDate = format(date, "yyyy-MM-dd");
        const response = await api.get<string[]>("/api/availability/", {
          params: {
            date: formattedDate,
            service_id: selectedService.id, // サービスIDをパラメータに追加
          },
        });
        if (response.data.length > 0) {
          setAvailableTimeSlots(response.data);
          setCurrentStep("TIME");
        } else {
          setStepError(
            "申し訳ありません。この日は受付可能な時間が設定されていません。"
          );
        }
      } catch (err) {
        setStepError("予約可能な時間の取得に失敗しました。");
        console.error(err);
      } finally {
        setTimeSlotsLoading(false);
      }
    },
    [selectedService]
  );

  const handleTimeSelect = useCallback((time: string) => {
    setSelectedTime(time);
    setCurrentStep("DETAILS");
  }, []);

  // ★ 予約内容確認画面へ進む処理
  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) {
      alert("必須項目（お名前とメールアドレス）を入力してください。");
      return;
    }
    setCurrentStep("CONFIRMATION");
  };

  // ★ 最終的な予約実行処理
  const handleFinalSubmit = useCallback(async () => {
    if (
      !selectedDate ||
      !selectedTime ||
      !customerName ||
      !customerEmail ||
      !salon ||
      !selectedService
    ) {
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
    } catch (err) {
      console.error("Failed to create reservation:", err);
      if (axios.isAxiosError(err) && err.response) {
        setError(
          `予約作成に失敗しました: ${JSON.stringify(err.response.data)}`
        );
      } else {
        setError("予約作成中に不明なエラーが発生しました。");
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    customerEmail,
    customerName,
    customerPhone,
    navigate,
    salon,
    selectedDate,
    selectedService,
    selectedTime,
    submitting,
  ]);

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

  // --- 2. 条件分岐による早期returnは、全てのフック定義の後に記述 ---
  if (loading)
    return <div className="text-center p-10">情報を読み込み中...</div>;
  if (error)
    return <div className="text-center p-10 text-red-500">エラー: {error}</div>;
  if (!salon)
    return <div className="text-center p-10">サロン情報が見つかりません。</div>;

  // --- 3. レンダリング ---
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Nail Momo
        </h2>

        {/* --- ① サービス選択 --- */}
        {currentStep === "SERVICE" && (
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              ◎ 1. メニューを選択
            </h3>
            <div className="space-y-3 mb-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className={`flex justify-between items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedService?.id === service.id
                      ? "bg-gray-200 border-gray-400"
                      : "bg-white border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <div>
                    <p className="text-lg font-semibold">{service.name}</p>
                    <p className="text-sm text-gray-600">
                      ({formatDuration(service.duration_minutes)})
                    </p>
                  </div>
                  <p className="text-lg font-bold">
                    {parseInt(service.price).toLocaleString()}円
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link to="/" className="text-blue-600 hover:underline">
                トップページに戻る
              </Link>
            </div>
          </div>
        )}

        {/* --- ② 日付選択 --- */}
        {currentStep === "DATE" && selectedService && (
          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                ◎ 2. 日付を選択
              </h3>
              {/* ▼▼▼ DatePickerのPropsを修正 ▼▼▼ */}
              <DatePicker
                selected={selectedDate}
                onChange={handleDateSelect}
                minDate={new Date()} // 過去日は選択不可
                filterDate={isBookable} // 予約可能な日のみ選択可能にする
                onMonthChange={(date) => setCurrentMonth(date)} // 月の変更をハンドリング
                inline
                locale="ja"
              />
              {stepError && (
                <p className="mt-4 text-red-500 font-semibold">{stepError}</p>
              )}
            </div>
            <button
              onClick={() => setCurrentStep("SERVICE")}
              className="mt-4 text-blue-600 hover:underline"
            >
              ← サービスの選択に戻る
            </button>
          </div>
        )}

        {/* --- ③ 時間選択 --- */}
        {currentStep === "TIME" && selectedService && selectedDate && (
          <div className="mt-8 pt-6 border-t">
            <div className="p-2 mb-4 bg-gray-100 rounded-md">
              <p className="font-semibold">
                <span className="text-sm">メニュー:</span>{" "}
                {selectedService.name}
              </p>
              <p className="font-semibold">
                <span className="text-sm">日付:</span>{" "}
                {format(selectedDate, "yyyy年MM月dd日")}
              </p>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              ◎ 3. 時間を選択して下さい
            </h3>
            {timeSlotsLoading ? (
              <p className="text-center text-gray-600">
                利用可能な時間枠を読み込み中...
              </p>
            ) : availableTimeSlots.length === 0 ? (
              <p className="text-red-600 text-center">
                この日付とサービスでは利用可能な時間枠がありません。
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeSelect(time)}
                    className="p-2 border rounded-md text-center hover:bg-blue-500 hover:text-white transition-colors"
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setCurrentStep("DATE")}
              className="mt-4 text-blue-600 hover:underline"
            >
              ← 日付の選択に戻る
            </button>
          </div>
        )}

        {/* --- ④ 予約者情報入力 --- */}
        {currentStep === "DETAILS" &&
          selectedService &&
          selectedDate &&
          selectedTime && (
            <div className="mt-8 pt-6 border-t">
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  ◎ 4. お客様情報を入力
                </h3>
                <form
                  onSubmit={handleProceedToConfirmation}
                  className="space-y-4"
                >
                  <div className="p-4 bg-gray-100 rounded-md space-y-1">
                    <p>
                      <strong>サービス:</strong> {selectedService.name}
                    </p>
                    <p>
                      <strong>日時:</strong>{" "}
                      {`${format(
                        selectedDate,
                        "yyyy年MM月dd日"
                      )} ${selectedTime}`}
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="block text-gray-700 font-semibold mb-1"
                    >
                      お名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="customer-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="山田 太郎"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="customer-email"
                      className="block text-gray-700 font-semibold mb-1"
                    >
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="customer-email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="block text-gray-700 font-semibold mb-1"
                    >
                      電話番号 (任意)
                    </label>
                    <input
                      type="tel"
                      id="customer-phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="090-XXXX-XXXX"
                    />
                  </div>
                  {submitting && (
                    <p className="text-center text-blue-600">予約を送信中...</p>
                  )}
                  {error && <p className="text-center text-red-500">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50"
                  >
                    予約を確定する
                  </button>
                </form>
                <button
                  onClick={() => setCurrentStep("TIME")}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  ← 時間の選択に戻る
                </button>
              </div>
            </div>
          )}

        {/* --- ★ ⑤ 予約内容確認 --- */}
        {currentStep === "CONFIRMATION" &&
          selectedService &&
          selectedDate &&
          selectedTime && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                ◎ 5. ご予約内容の確認
              </h3>

              {/* キャンセルポリシー表示 */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <h4 className="font-bold text-yellow-800">
                  キャンセルポリシー
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  キャンセルは直接店舗にご連絡ください。
                </p>
              </div>

              {/* 予約内容 */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-md">
                <div>
                  <strong className="w-28 inline-block">サービス:</strong>{" "}
                  {selectedService.name}
                </div>
                <div>
                  <strong className="w-28 inline-block">料金:</strong>{" "}
                  {parseInt(selectedService.price).toLocaleString()}円
                </div>
                <div>
                  <strong className="w-28 inline-block">日時:</strong>{" "}
                  {`${format(selectedDate, "yyyy年MM月dd日")} ${selectedTime}`}
                </div>
                <hr className="my-3" />
                <div>
                  <strong className="w-28 inline-block">お名前:</strong>{" "}
                  {customerName}
                </div>
                <div>
                  <strong className="w-28 inline-block">メール:</strong>{" "}
                  {customerEmail}
                </div>
                <div>
                  <strong className="w-28 inline-block">電話番号:</strong>{" "}
                  {customerPhone || "未入力"}
                </div>
              </div>

              {submitting && (
                <p className="text-center text-blue-600 mt-4">
                  予約を送信中...
                </p>
              )}
              {error && (
                <p className="text-center text-red-500 mt-4">{error}</p>
              )}

              {/* アクションボタン */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50"
                >
                  この内容で予約する
                </button>
                <button
                  onClick={() => setCurrentStep("DETAILS")}
                  disabled={submitting}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-300"
                >
                  入力内容を修正する
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ServiceAndReservationPicker;
