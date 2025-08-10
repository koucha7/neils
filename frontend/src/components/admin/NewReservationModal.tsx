import React, { useState, useEffect } from "react";
import api from "../../api/axiosConfig";

interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

export default function NewReservationModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    service_id: "",
    date: "",
    time: "",
  });
  const [message, setMessage] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlotData, setTimeSlotData] = useState<{
    available_times: string[];
    outside_business_hours: string[];
    booked_times: string[];
  }>({
    available_times: [],
    outside_business_hours: [],
    booked_times: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // 30分単位の時間スロットを生成する関数
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    slots.push('21:00'); // 最後の21:00を追加
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 詳細な時間スロット情報を取得する関数
  const fetchDetailedTimeSlots = async (date: string) => {
    if (!date) {
      setTimeSlotData({
        available_times: [],
        outside_business_hours: [],
        booked_times: []
      });
      return;
    }

    setLoadingTimes(true);
    try {
      const response = await api.get(`/api/admin/detailed-time-slots/?date=${date}`);
      setTimeSlotData(response.data);
    } catch (error) {
      console.error("時間スロット情報の取得に失敗しました:", error);
      setTimeSlotData({
        available_times: [],
        outside_business_hours: [],
        booked_times: []
      });
    } finally {
      setLoadingTimes(false);
    }
  };

  // サービス一覧を取得
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/api/services/");
        // レスポンスが配列であることを確認
        const servicesData = Array.isArray(response.data) ? response.data : [];
        setServices(servicesData);
      } catch (error) {
        console.error("サービス一覧の取得に失敗しました:", error);
        setServices([]); // エラー時は空配列に設定
      }
    };
    fetchServices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // 日付が変更された場合、利用可能時間を取得
    if (name === 'date') {
      setForm(prev => ({ ...prev, time: "" })); // 時間をリセット
      fetchDetailedTimeSlots(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    try {
      // 日付と時間を組み合わせてISO形式の文字列を作成
      const start_time = `${form.date}T${form.time}:00`;
      
      await api.post("/api/admin/reservations/create-with-new-customer/", {
        name: form.name,
        phone_number: form.phone_number,
        email: form.email,
        service_id: form.service_id,
        start_time: start_time
      });
      setMessage("新規顧客と予約を確定済みで作成しました。");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "作成に失敗しました。";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          <h3 className="text-base font-bold mb-4">新規顧客＋予約作成</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              顧客名 *
            </label>
            <input 
              name="name" 
              type="text" 
              value={form.name} 
              onChange={handleChange} 
              required 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              電話番号
            </label>
            <input 
              name="phone_number" 
              type="tel" 
              value={form.phone_number} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input 
              name="email" 
              type="email" 
              value={form.email} 
              onChange={handleChange} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              サービス *
            </label>
            <select 
              name="service_id" 
              value={form.service_id} 
              onChange={handleChange} 
              required 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>サービスを選択してください</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration_minutes}分) - ¥{service.price}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予約日 *
            </label>
            <input 
              name="date" 
              type="date" 
              value={form.date} 
              onChange={handleChange} 
              required 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予約時間 *
            </label>
            <select 
              name="time" 
              value={form.time} 
              onChange={handleChange} 
              required 
              disabled={!form.date || loadingTimes}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {!form.date ? "まず日付を選択してください" : 
                 loadingTimes ? "利用可能時間を読み込み中..." : 
                 "時間を選択"}
              </option>
              {/* 営業時間内で予約可能な時間 */}
              {timeSlotData.available_times.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
              {/* 営業時間外で予約可能な時間 */}
              {timeSlotData.outside_business_hours.map((time) => (
                <option key={time} value={time}>
                  {time} (営業時間外)
                </option>
              ))}
              {/* 予約済みの時間は表示しない */}
            </select>
            {form.date && (timeSlotData.available_times.length === 0 && timeSlotData.outside_business_hours.length === 0) && !loadingTimes && (
              <p className="text-red-500 text-sm mt-1">
                この日は予約可能な時間がありません。
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "作成中..." : "作成"}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
            >
              キャンセル
            </button>
          </div>
          
          {message && (
            <div className={`mt-4 p-2 text-sm rounded ${
              message.includes('成功') || message.includes('作成しました') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}