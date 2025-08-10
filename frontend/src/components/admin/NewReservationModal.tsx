import React, { useState, useEffect } from "react";
import axios from "axios";

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
    start_time: "",
  });
  const [message, setMessage] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // サービス一覧を取得
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get("/api/services/", {
          headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
        });
        setServices(response.data);
      } catch (error) {
        console.error("サービス一覧の取得に失敗しました:", error);
      }
    };
    fetchServices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    
    try {
      await axios.post("/api/admin/reservations/create-with-new-customer/", form, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      setMessage("新規顧客と予約を作成しました。");
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
          <h3 className="text-lg font-bold mb-4">新規顧客＋予約作成</h3>
          
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
              <option value="">メニューを選択</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration_minutes}分) - ¥{service.price}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予約日時 *
            </label>
            <input 
              name="start_time" 
              type="datetime-local" 
              value={form.start_time} 
              onChange={handleChange} 
              required 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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