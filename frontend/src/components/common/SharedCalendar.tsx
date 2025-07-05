import React, { useState, useEffect, useCallback } from 'react';
// ▼▼▼【エラー修正点 1/2】'ReactDatePickerProps' を正しい 'DatePickerProps' に修正します ▼▼▼
import DatePicker, { registerLocale, CalendarContainer, DatePickerProps } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ja } from 'date-fns/locale/ja';
import { format, isSameDay } from 'date-fns';
import api from '../../api/axiosConfig';

registerLocale("ja", ja);

const MyCalendarContainer: React.FC<{ className?: string, children: React.ReactNode }> = ({ className, children }) => {
  return (
    <div className={className} style={{ width: '100%', padding: '10px', border: 'none' }}>
      <div style={{ position: 'relative', width: '100%' }}>{children}</div>
    </div>
  );
};

interface SharedCalendarProps {
  // ▼▼▼【エラー修正点 2/2】onDateSelectがnullを受け取れるように型を修正します ▼▼▼
  onDateSelect: (date: Date | null) => void;
  apiEndpoint: string;
  highlightClassName: string;
  selectedDate: Date | null;
  isBookable?: boolean;
}

const SharedCalendar: React.FC<SharedCalendarProps> = ({ 
  onDateSelect, 
  apiEndpoint, 
  highlightClassName,
  selectedDate,
  isBookable = false
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(new Set());

  const fetchHighlightedDates = useCallback(async (month: Date) => {
    try {
      const year = month.getFullYear();
      const monthNum = month.getMonth() + 1;
      const response = await api.get(apiEndpoint, { params: { year, month: monthNum } });
      if (Array.isArray(response.data)) {
        setHighlightedDates(new Set(response.data));
      }
    } catch (error) {
      console.error("ハイライト日付の取得に失敗しました:", error);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchHighlightedDates(currentMonth);
  }, [currentMonth, fetchHighlightedDates]);

  const today = new Date();
  const isPastDate = (date: Date) => date < today && !isSameDay(date, today);

  return (
    <div className="custom-calendar-container">
      <DatePicker
        selected={selectedDate}
        onChange={onDateSelect} // 親から渡された関数をそのまま呼び出します
        minDate={today}
        inline
        locale="ja"
        onMonthChange={(date) => setCurrentMonth(date)}
        calendarContainer={MyCalendarContainer}
        filterDate={isBookable ? (date) => highlightedDates.has(format(date, 'yyyy-MM-dd')) : undefined}
        dayClassName={(date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const classes = [];
          if (isPastDate(date)) classes.push("past-date");
          if (!isBookable && highlightedDates.has(dateStr)) {
            classes.push(highlightClassName);
          }
          return classes.join(" ");
        }}
      />
    </div>
  );
};

export default SharedCalendar;
