import axios from "axios";
import { format /* startOfMonth */ } from "date-fns";
import { ja } from "date-fns/locale/ja";
import {
  BarChart3,
  Bell,
  Calendar,
  Edit,
  LogOut,
  Menu as MenuIcon,
  PlusCircle,
  Scissors,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import StatisticsPanel from "./StatisticsPanel";

registerLocale("ja", ja);

// --- 型定義 ---
interface Service {
  id: number;
  salon: number;
  name: string;
  price: string;
  duration_minutes: number;
}
interface Reservation {
  id: number;
  reservation_number: string;
  customer_name: string;
  start_time: string;
  status: string;
  service: { name: string };
}
interface NotificationSettings {
  id: number;
  unconfirmed_reminder_enabled: boolean;
  unconfirmed_reminder_days_before: number;
  schedule_reminder_enabled: boolean;
  schedule_reminder_days_before: number;
}

// --- 各管理画面コンポーネント (AdminPanelの外で定義) ---

// 1. メニュー管理
const MenuManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(
    null
  );
  const DURATION_CHOICES = [30, 60, 90, 120, 150, 180, 210, 240];
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/services/");
      setServices(response.data);
    } catch (err) {
      setError("メニューの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  const handleSave = async (serviceToSave: Partial<Service>) => {
    const payload = { ...serviceToSave, salon: 1 };
    try {
      if ("id" in serviceToSave && serviceToSave.id) {
        await api.patch(`/api/services/${serviceToSave.id}/`, payload);
      } else {
        await api.post("/api/services/", payload);
      }
      setEditingService(null);
      await fetchServices();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        alert(`保存に失敗しました: ${JSON.stringify(err.response.data)}`);
      } else {
        alert("保存中に不明なエラーが発生しました。");
      }
    }
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm("このメニューを削除しますか？")) return;
    try {
      await api.delete(`/api/services/${id}/`);
      await fetchServices();
    } catch (error) {
      alert("削除に失敗しました。");
    }
  };
  const ServiceForm = ({
    service,
    onSave,
    onCancel,
  }: {
    service: Partial<Service>;
    onSave: (s: Partial<Service>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState(service);
    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };
    return (
      <form
        onSubmit={handleSubmit}
        className="bg-gray-50 p-4 my-4 rounded-lg shadow space-y-4"
      >
        <h3 className="text-lg font-semibold">
          {"id" in service && service.id ? "メニュー編集" : "新規メニュー追加"}
        </h3>
        <div>
          <label className="block text-sm font-medium">メニュー名</label>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">料金 (円)</label>
          <input
            type="number"
            name="price"
            value={formData.price || ""}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">所要時間</label>
          <select
            name="duration_minutes"
            value={formData.duration_minutes || 30}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded bg-white"
          >
            {DURATION_CHOICES.map((d) => (
              <option key={d} value={d}>
                {d} 分
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            保存
          </button>
        </div>
      </form>
    );
  };
  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">メニュー管理</h2>
        <button
          onClick={() =>
            setEditingService({ name: "", price: "0", duration_minutes: 90 })
          }
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          <PlusCircle size={20} className="mr-2" /> 新規追加
        </button>
      </div>{" "}
      {editingService && (
        <ServiceForm
          service={editingService}
          onSave={handleSave}
          onCancel={() => setEditingService(null)}
        />
      )}{" "}
      <div className="bg-white p-4 rounded-lg shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">メニュー名</th>
              <th className="text-left p-2">料金</th>
              <th className="text-left p-2">所要時間(分)</th>
              <th className="text-left p-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {" "}
            {services.map((service) => (
              <tr key={service.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{service.name}</td>
                <td className="p-2">
                  {parseInt(service.price).toLocaleString()}円
                </td>
                <td className="p-2">{service.duration_minutes}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => setEditingService(service)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}{" "}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 2. 受付時間設定
const AttendanceManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<
    { time: string; is_available: boolean }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [configuredDates, setConfiguredDates] = useState<Date[]>([]);

  const fetchConfiguredDates = useCallback(async (month: Date) => {
    try {
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      const response = await api.get("/api/admin/configured-dates/", {
        params: { year, month: monthNum },
      });
      const dates = response.data.map((dateStr: string) => new Date(dateStr));
      setConfiguredDates(dates);
    } catch (error) {
      console.error("設定済み日付の取得に失敗しました:", error);
    }
  }, []);

  // 月の変更時に設定済み日付を再取得
  useEffect(() => {
    fetchConfiguredDates(currentMonth);
  }, [currentMonth, fetchConfiguredDates]);

  // 日付クリックハンドラー
  const handleDateClick = async (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    setIsSubmitting(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await api.get("/api/admin/available-slots/", {
        params: { date: dateStr },
      });
      setTimeSlots(response.data);
      setIsModalOpen(true);
    } catch (error) {
      alert("時間枠の読み込みに失敗しました。");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSlotToggle = (timeToToggle: string) => {
    setTimeSlots((prevSlots) =>
      prevSlots.map((slot) =>
        slot.time === timeToToggle
          ? { ...slot, is_available: !slot.is_available }
          : slot
      )
    );
  };

  // 保存ボタンのハンドラー
  const handleSave = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    try {
      const availableTimes = timeSlots
        .filter((slot) => slot.is_available)
        .map((slot) => slot.time);
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      await api.post("/api/admin/available-slots/", {
        date: dateStr,
        times: availableTimes,
      });

      setIsModalOpen(false);
      alert("保存しました。");

      // ▼▼▼ この一行を追加 ▼▼▼
      // 保存後に設定済み日付のリストを再取得してカレンダーを更新します
      fetchConfiguredDates(currentMonth);
    } catch (error) {
      console.error("受付時間の設定に失敗しました。", error);
      alert("設定の保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();

  const isPastDate = (date: Date) => {
    return date < today && !isSameDay(date, today);
  };

  // 設定済みの日付かどうかを判断する関数
  const isConfiguredDate = (date: Date) => {
    return configuredDates.some((d) => isSameDay(d, date));
  };

  // isSameDayヘルパー関数（日付の比較用）
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // ▼▼▼ DayPickerに渡すための設定を定義 ▼▼▼
  /*   const modifiers = {
    configured: configuredDates, // 設定済みの日付
  };
  const modifiersStyles = {
    // configuredクラスに適用するスタイル
    configured: {
      backgroundColor: "#dcfce7", // 例：薄い緑色
      color: "#166534",
    },
  }; */

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">受付時間設定</h2>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-gray-600 mb-4">
          カレンダーの日付をクリックして、予約を受け付ける30分単位の時間枠を個別に設定します。
        </p>
        <div className="flex justify-center">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateClick}
            minDate={today} // minDateで過去の日付を選択不可に
            inline
            locale="ja"
            onMonthChange={(date) => setCurrentMonth(date)} // 月の変更をハンドリング
            // 日付ごとのCSSクラスを動的に設定
            dayClassName={(date) => {
              if (isPastDate(date)) return "past-date";
              if (isConfiguredDate(date)) return "configured-date";
              return ""; // undefined の代わりに空文字列を返す
            }}
          />
        </div>
      </div>{" "}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h4 className="text-lg font-bold mb-4">
              {format(selectedDate, "yyyy年 M月 d日")} の受付時間設定
            </h4>
            <div className="max-h-96 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 border p-4 rounded-md">
              {" "}
              {timeSlots.map((slot) => (
                <label
                  key={slot.time}
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={slot.is_available}
                    onChange={() => handleSlotToggle(slot.time)}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-700 font-mono">
                    {slot.time}
                  </span>
                </label>
              ))}{" "}
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-md"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md disabled:bg-blue-400"
              >
                {" "}
                {isSubmitting ? "保存中..." : "保存"}{" "}
              </button>
            </div>
          </div>
        </div>
      )}{" "}
    </div>
  );
};

// 3. 予約一覧
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
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "confirmed",
    "pending",
  ]);
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
      if (startDate) {
        params.append("start_date", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        params.append("end_date", format(endDate, "yyyy-MM-dd"));
      }
      if (selectedStatuses.length > 0) {
        selectedStatuses.forEach((status) => {
          params.append("status", status);
        });
      }
      const response = await api.get<Reservation[]>("/api/reservations/", {
        params,
      });
      const sorted = response.data.sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
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
    setSelectedStatuses((prevStatuses) => {
      if (prevStatuses.includes(statusValue)) {
        return prevStatuses.filter((s) => s !== statusValue);
      } else {
        return [...prevStatuses, statusValue];
      }
    });
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
    if (!window.confirm(`${reservationNumber} の予約をキャンセルしますか？`))
      return;
    try {
      await api.post(`/api/reservations/${reservationNumber}/cancel/`);
      await fetchReservations();
    } catch (err) {
      alert("予約のキャンセル処理中にエラーが発生しました。");
    }
  };
  const handleRowClick = (reservationNumber: string) => {
    navigate(`/admin/reservations/${reservationNumber}`);
  };
  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">予約一覧</h2>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-2">日付範囲で絞り込む</h3>
        <div className="flex items-center space-x-2">
          <label className="text-gray-700">開始日:</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="yyyy/MM/dd"
            placeholderText="開始日を選択"
            className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            isClearable
            locale="ja"
            selectsStart
            startDate={startDate}
            endDate={endDate}
          />
          <label className="text-gray-700">終了日:</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="yyyy/MM/dd"
            placeholderText="終了日を選択"
            className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            isClearable
            locale="ja"
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || undefined}
          />{" "}
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              {" "}
              クリア{" "}
            </button>
          )}{" "}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-2">ステータスで絞り込む</h3>
        <div className="flex flex-wrap items-center space-x-4">
          {" "}
          {allStatuses.map((statusOption) => (
            <label
              key={statusOption.value}
              className="inline-flex items-center"
            >
              <input
                type="checkbox"
                value={statusOption.value}
                checked={selectedStatuses.includes(statusOption.value)}
                onChange={() => handleStatusChange(statusOption.value)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">{statusOption.label}</span>
            </label>
          ))}{" "}
          {selectedStatuses.length > 0 && (
            <button
              onClick={() => setSelectedStatuses([])}
              className="text-gray-500 hover:text-gray-700"
            >
              {" "}
              全てクリア{" "}
            </button>
          )}{" "}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <table className="min-w-full leading-normal hidden sm:table">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">予約ID</th>
              <th className="text-left p-2">予約日時</th>
              <th className="text-left p-2">顧客名</th>
              <th className="text-left p-2">メニュー</th>
              <th className="text-left p-2">ステータス</th>
              <th className="text-left p-2">アクション</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {" "}
            {reservations.map((r) => (
              <tr
                key={r.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(r.reservation_number)}
              >
                <td className="p-2">{r.reservation_number}</td>
                <td className="p-2">
                  {new Date(r.start_time).toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="p-2">{r.customer_name}</td>
                <td className="p-2">{r.service.name}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      r.status === "pending"
                        ? "bg-yellow-200 text-yellow-800"
                        : r.status === "confirmed"
                        ? "bg-green-200 text-green-800"
                        : r.status === "cancelled"
                        ? "bg-red-200 text-red-800"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td
                  className="p-2 space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {" "}
                  {r.status === "pending" && (
                    <button
                      onClick={() => handleConfirm(r.reservation_number)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      確定
                    </button>
                  )}{" "}
                  {r.status !== "cancelled" && r.status !== "completed" && (
                    <button
                      onClick={() => handleCancel(r.reservation_number)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      取消
                    </button>
                  )}{" "}
                </td>
              </tr>
            ))}{" "}
          </tbody>
        </table>
        <div className="sm:hidden space-y-4">
          {" "}
          {reservations.map((r) => (
            <div
              key={r.id}
              className="bg-white shadow rounded-md p-4 cursor-pointer"
              onClick={() => handleRowClick(r.reservation_number)}
            >
              <p className="text-sm font-semibold text-gray-600">
                予約ID: {r.reservation_number}
              </p>
              <p className="text-sm font-semibold text-gray-600">
                日時:{" "}
                {new Date(r.start_time).toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm font-semibold text-gray-600">
                顧客名: {r.customer_name}
              </p>
              <p className="text-sm font-semibold text-gray-600">
                メニュー: {r.service.name}
              </p>
              <p className="text-sm font-semibold text-gray-600">
                {" "}
                ステータス:{" "}
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    r.status === "pending"
                      ? "bg-yellow-200 text-yellow-800"
                      : r.status === "confirmed"
                      ? "bg-green-200 text-green-800"
                      : r.status === "cancelled"
                      ? "bg-red-200 text-red-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {r.status}
                </span>
              </p>
              <div
                className="mt-2 space-x-2"
                onClick={(e) => e.stopPropagation()}
              >
                {" "}
                {r.status === "pending" && (
                  <button
                    onClick={() => handleConfirm(r.reservation_number)}
                    className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600"
                  >
                    確定
                  </button>
                )}{" "}
                {r.status !== "cancelled" && r.status !== "completed" && (
                  <button
                    onClick={() => handleCancel(r.reservation_number)}
                    className="bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"
                  >
                    取消
                  </button>
                )}{" "}
              </div>
            </div>
          ))}{" "}
        </div>
      </div>
    </div>
  );
};

// 4. 通知設定
const NotificationSettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/notification-settings/");
        setSettings(response.data);
      } catch (err) {
        setError("設定の読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await api.put("/api/notification-settings/", settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("設定の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!settings) return <p>設定データが見つかりません。</p>;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === "checkbox" ? checked : parseInt(value, 10),
          }
        : null
    );
  };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">通知設定</h2>
      <div className="bg-white p-6 rounded-lg shadow space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            【管理者向け】予約未確定リマインダー
          </h3>
          <label className="flex items-center cursor-pointer w-fit">
            <input
              type="checkbox"
              name="unconfirmed_reminder_enabled"
              checked={settings.unconfirmed_reminder_enabled}
              onChange={handleChange}
              className="mr-3 h-5 w-5 rounded"
            />
            <span>リマインダーを有効にする</span>
          </label>
          <div
            className={
              !settings.unconfirmed_reminder_enabled ? "opacity-50" : ""
            }
          >
            <label className="block text-sm font-medium text-gray-700">
              リマインド日数
            </label>
            <input
              type="number"
              name="unconfirmed_reminder_days_before"
              value={settings.unconfirmed_reminder_days_before}
              onChange={handleChange}
              disabled={!settings.unconfirmed_reminder_enabled}
              min="1"
              max="14"
              className="w-24 mt-1 p-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              予約日の何日前に通知するか (1〜14日)
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">
            【管理者向け】スケジュールリマインダー
          </h3>
          <label className="flex items-center cursor-pointer w-fit">
            <input
              type="checkbox"
              name="schedule_reminder_enabled"
              checked={settings.schedule_reminder_enabled}
              onChange={handleChange}
              className="mr-3 h-5 w-5 rounded"
            />
            <span>リマインダーを有効にする</span>
          </label>
          <div
            className={!settings.schedule_reminder_enabled ? "opacity-50" : ""}
          >
            <label className="block text-sm font-medium text-gray-700">
              リマインド日数
            </label>
            <input
              type="number"
              name="schedule_reminder_days_before"
              value={settings.schedule_reminder_days_before}
              onChange={handleChange}
              disabled={!settings.schedule_reminder_enabled}
              min="1"
              max="7"
              className="w-24 mt-1 p-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              何日後の予約状況を通知するか (1〜7日)
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end pt-4 border-t">
          {success && <p className="text-green-600 mr-4">保存しました！</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "設定を保存"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. キャンセルポリシー設定
const CancellationPolicyManagement: React.FC = () => {
  const [deadline, setDeadline] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/salons/1/");
        setDeadline(response.data.cancellation_deadline_days);
      } catch (err) {
        setError("設定の読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);
  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      await api.patch("/api/salons/1/", {
        cancellation_deadline_days: deadline,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("設定の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">キャンセルポリシー設定</h2>
      <div className="bg-white p-6 rounded-lg shadow max-w-lg">
        <div className="space-y-2">
          <label
            htmlFor="deadline-days"
            className="block text-lg font-semibold text-gray-800"
          >
            キャンセル受付期限
          </label>
          <p className="text-sm text-gray-500">
            お客様がご自身でキャンセルできるのは、予約日の何日前までかを設定します。
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <input
              type="number"
              id="deadline-days"
              value={deadline}
              onChange={(e) => setDeadline(parseInt(e.target.value, 10))}
              min="0"
              className="w-28 p-2 border border-gray-300 rounded-md shadow-sm"
            />
            <span className="text-gray-700">日前まで可能</span>
          </div>
          <p className="text-xs text-gray-500">
            例:
            「2」と設定すると、予約日の2日前（前々日）まではキャンセル可能です。
          </p>
        </div>
        <div className="flex items-center justify-end pt-6 mt-6 border-t">
          {success && <p className="text-green-600 mr-4">保存しました！</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "設定を保存"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 6. ログイン画面
const LoginScreen: React.FC<{ onLoginSuccess: () => void }> = ({
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await api.post("/api/token/", { username, password });
      localStorage.setItem("accessToken", response.data.access);
      localStorage.setItem("refreshToken", response.data.refresh);
      onLoginSuccess();
    } catch (err) {
      setError("ユーザー名またはパスワードが間違っています。");
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800">
          MomoNail 管理画面
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ユーザー名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>{" "}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}{" "}
        <button
          type="submit"
          className="w-full px-4 py-2 text-lg font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {" "}
          ログイン{" "}
        </button>
      </form>
    </div>
  );
};

// --- メインコンポーネント ---
const AdminPanel: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true"
  );
  const [page, setPage] = useState<
    "reservations" | "schedule" | "menu" | "settings" | "policy" | "statistics"
  >("reservations");
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 640
  );
  useEffect(() => {
    localStorage.setItem("isLoggedIn", String(isLoggedIn));
  }, [isLoggedIn]);
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);
  const renderPage = () => {
    switch (page) {
      case "reservations":
        return <ReservationList />;
      case "schedule":
        return <AttendanceManagement />;
      case "menu":
        return <MenuManagement />;
      case "settings":
        return <NotificationSettingsManagement />;
      case "policy":
        return <CancellationPolicyManagement />;
      case "statistics":
        return <StatisticsPanel />;
      default:
        return <ReservationList />;
    }
  };
  const handleLoginSuccess = () => setIsLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsLoggedIn(false);
  };
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <aside
        className={`w-64 bg-gray-800 text-white flex-col ${
          isSidebarOpen ? "flex" : "hidden sm:flex"
        }`}
      >
        <div className="p-4 text-2xl font-bold border-b border-gray-700">
          NailMomo
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <button
            onClick={() => {
              setPage("reservations");
              setIsSidebarOpen(false);
            }}
            className={`w-full text-left flex items-center px-4 py-2 rounded-md ${
              page === "reservations" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <Users className="mr-3" size={20} /> 予約確認
          </button>
          <button
            onClick={() => {
              setPage("schedule");
              setIsSidebarOpen(false);
            }}
            className={`w-full text-left flex items-center px-4 py-2 rounded-md ${
              page === "schedule" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <Calendar className="mr-3" size={20} /> 受付時間設定
          </button>
          <button
            onClick={() => {
              setPage("menu");
              setIsSidebarOpen(false);
            }}
            className={`w-full text-left flex items-center px-4 py-2 rounded-md ${
              page === "menu" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <Scissors className="mr-3" size={20} /> メニュー管理
          </button>
          <button
            onClick={() => {
              setPage("settings");
              setIsSidebarOpen(false);
            }}
            className={`w-full text-left flex items-center px-4 py-2 rounded-md ${
              page === "settings" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <Bell className="mr-3" size={20} /> 通知設定
          </button>
          <button
            onClick={() => {
              setPage("policy");
              setIsSidebarOpen(false);
            }}
            className={`w-full text-left flex items-center px-4 py-2 rounded-md ${
              page === "policy" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <Shield className="mr-3" size={20} /> キャンセルポリシー
          </button>
          <button
            onClick={() => {
              setPage("statistics");
              setIsSidebarOpen(false);
            }}
            className={`w-full text-left flex items-center px-4 py-2 rounded-md ${
              page === "statistics" ? "bg-gray-700" : "hover:bg-gray-700"
            }`}
          >
            <BarChart3 className="mr-3" size={20} /> 統計
          </button>
        </nav>
        <div className="p-2 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center px-4 py-2 rounded-md hover:bg-gray-700"
          >
            <LogOut className="mr-3" size={20} /> ログアウト{" "}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <button
          onClick={toggleSidebar}
          className="sm:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md shadow-lg"
        >
          {isSidebarOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
        <div className={`${isSidebarOpen ? "sm:ml-0" : "sm:ml-0"}`}>
          {" "}
          {renderPage()}{" "}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
