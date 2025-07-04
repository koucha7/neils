import React, { useState, useEffect, useCallback } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ja } from 'date-fns/locale/ja';
import { format, isSameDay, parseISO } from 'date-fns';
import api from '../../api/axiosConfig';

// 日本語ロケールを登録
registerLocale("ja", ja);

const AttendanceManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<{ time: string; is_available: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [configuredDates, setConfiguredDates] = useState<Set<string>>(new Set());

  const fetchConfiguredDates = useCallback(async (month: Date) => {
    try {
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      const response = await api.get("/api/admin/configured-dates/", {
        params: { year, month: monthNum },
      });
      
      if (Array.isArray(response.data)) {
        // response.data は ["2025-07-24", "2025-07-25"] のような文字列の配列を想定
        setConfiguredDates(new Set(response.data));
      } else {
        console.error("設定済み日付の応答が予期せぬ形式です:", response.data);
        setConfiguredDates(new Set()); // データが不正な場合は空にする
      }

    } catch (error: any) {
      console.error("設定済み日付の取得に失敗しました:", error);
      if (error.response) {
        console.log("サーバーからのエラー応答:", error.response.data);
      }
    }
  }, []);

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
      fetchConfiguredDates(currentMonth); // 保存後に設定済み日付を再取得
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
            minDate={today}
            inline
            locale="ja"
            onMonthChange={(date) => setCurrentMonth(date)}
            dayClassName={(date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const classes = [];
              if (isPastDate(date)) {
                classes.push("past-date"); // 過去の日付用のクラス
              }
              // 設定済みの日付に背景色を適用します
              if (configuredDates.has(dateStr)) {
                classes.push("bg-green-200 text-green-800 font-bold");
              }
              return classes.join(" ");
            }}
            calendarClassName="w-full"
            popperPlacement="bottom"
          />
        </div>
      </div>
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h4 className="text-lg font-bold mb-4">{format(selectedDate, "yyyy年 M月 d日")} の受付時間設定</h4>
            <div className="max-h-96 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-2 border p-4 rounded-md">
              {timeSlots.map((slot) => (
                <label key={slot.time} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                  <input type="checkbox" checked={slot.is_available} onChange={() => handleSlotToggle(slot.time)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                  <span className="ml-3 text-gray-700 font-mono">{slot.time}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
              <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-md">キャンセル</button>
              <button onClick={handleSave} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md disabled:bg-blue-400">
                {isSubmitting ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
