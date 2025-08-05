import React, { useState, useEffect, useCallback } from 'react';
import DatePicker, { registerLocale, CalendarContainer } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ja } from 'date-fns/locale/ja';
import { format, isSameDay } from 'date-fns';
import api from '../../api/axiosConfig';
import { useAdminAuth } from '../../context/AdminAuthContext';

// 日本語ロケールを登録
registerLocale("ja", ja);

// カレンダーの見た目をカスタマイズするためのコンポーネント
const MyCalendarContainer: React.FC<{ className?: string, children: React.ReactNode }> = ({ className, children }) => {
  return (
    <div className={className} style={{ width: '100%', padding: '10px', border: 'none' }}>
      <div style={{ position: 'relative', width: '100%' }}>{children}</div>
    </div>
  );
};

const AttendanceManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<{ time: string; is_available: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [configuredDates, setConfiguredDates] = useState<Set<string>>(new Set());

  const { user } = useAdminAuth();
  const fetchConfiguredDates = useCallback(async (month: Date) => {
    if (!user) return;
    try {
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      let params: any = { year, month: monthNum };
      if (!user.is_superuser) {
        params.user_id = String(user.id);
      }
      const response = await api.get("/api/admin/configured-dates/", {
        params,
      });
      if (Array.isArray(response.data)) {
        setConfiguredDates(new Set(response.data));
      } else {
        console.error("設定済み日付の応答が予期せぬ形式です:", response.data);
        setConfiguredDates(new Set());
      }
    } catch (error: any) {
      console.error("設定済み日付の取得に失敗しました:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchConfiguredDates(currentMonth);
  }, [currentMonth, fetchConfiguredDates]);

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
    setTimeSlots((prev) =>
      prev.map((slot) =>
        slot.time === timeToToggle
          ? { ...slot, is_available: !slot.is_available }
          : slot
      )
    );
  };

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
      fetchConfiguredDates(currentMonth);
    } catch (error) {
      console.error("受付時間の設定に失敗しました。", error);
      alert("設定の保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const isPastDate = (date: Date) => date < today && !isSameDay(date, today);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 whitespace-nowrap">受付時間設定</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600 mb-4">
          カレンダーの日付をクリックして、予約を受け付ける30分単位の時間枠を個別に設定します。
        </p>
        
        {/* カレンダーをdivで囲み、スタイルを適用 */}
        <div className="custom-calendar-container">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateClick}
            minDate={today}
            inline
            locale="ja"
            onMonthChange={(date) => setCurrentMonth(date)}
            calendarContainer={MyCalendarContainer} // カスタムコンテナを適用
            // 日付ごとのCSSクラスを動的に設定
            dayClassName={(date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const classes = [];
              if (isPastDate(date)) {
                classes.push("past-date");
              }
              if (configuredDates.has(dateStr)) {
                classes.push("configured-date");
              }
              return classes.join(" ");
            }}
          />
        </div>

      </div>

      {/* モーダル部分（変更なし） */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h4 className="text-lg font-bold mb-4">{format(selectedDate, "yyyy年 M月 d日")} の受付時間設定</h4>
            <div className="max-h-96 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 border p-4 rounded-md">
              {timeSlots.map((slot) => (
                <label key={slot.time} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                  <input type="checkbox" checked={slot.is_available} onChange={() => handleSlotToggle(slot.time)} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                  <span className="ml-3 text-gray-700 font-mono">{slot.time}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
              <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-md">キャンセル</button>
              <button onClick={handleSave} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md disabled:bg-indigo-400">
                {isSubmitting ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ▼▼▼【CSSの追加】▼▼▼ */}
      {/* 以下のスタイルをコンポーネントに追加します */}
      <style>{`
        .custom-calendar-container .react-datepicker {
          width: 100%;
          border: none;
          font-size: 1rem; /* 文字サイズを大きく */
        }
        .custom-calendar-container .react-datepicker__month-container {
          width: 100%;
        }
        .custom-calendar-container .react-datepicker__header {
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }
        .custom-calendar-container .react-datepicker__current-month {
          font-size: 1.25rem; /* 月の表示を大きく */
          padding: 1rem 0;
        }
        .custom-calendar-container .react-datepicker__day-name,
        .custom-calendar-container .react-datepicker__day {
          width: 14.28%; /* 7等分 */
          height: 50px; /* 日付の高さを大きく */
          line-height: 50px;
          margin: 0;
        }
        .custom-calendar-container .react-datepicker__week {
          display: flex;
          align-items: center;
          }
        .custom-calendar-container .react-datepicker__day {
          border-radius: 50%;
          transition: background-color 0.2s;
        }
        .custom-calendar-container .react-datepicker__day:hover {
          background-color: #e9ecef;
        }
        .custom-calendar-container .react-datepicker__day--selected {
          background-color: #4f46e5; /* Indigo-600 */
          color: white;
        }
        .custom-calendar-container .react-datepicker__day--keyboard-selected {
          background-color: #6366f1; /* Indigo-500 */
          color: white;
        }
        .custom-calendar-container .past-date {
          color: #adb5bd;
          text-decoration: line-through;
        }
        .custom-calendar-container .configured-date {
          background-color: #dcfce7; /* Green-100 */
          color: #166534; /* Green-800 */
          font-weight: bold;
        }
        .custom-calendar-container .react-datepicker__day--outside-month {
          color: #ced4da;
        }
      `}</style>
    </div>
  );
};

export default AttendanceManagement;
