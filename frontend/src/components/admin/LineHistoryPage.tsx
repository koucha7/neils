// frontend/src/components/admin/LineHistoryPage.tsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig";
import { format } from "date-fns";
import {
  User,
  Image as ImageIcon,
  SlidersHorizontal,
  ChevronUp,
} from "lucide-react";
import { isSameDay } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ja } from "date-fns/locale/ja";

// 型定義
interface Message {
  id: string;
  customer: number;
  customer_name: string;
  customer_line_picture_url: string | null;
  sender_type: "customer" | "admin";
  message: string | null;
  image_url: string | null;
  sent_at: string;
}

interface HistoryFilters {
  customer_id: string;
  start_date: string;
  end_date: string;
  query: string;
}

const LineHistoryPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchParams] = useSearchParams();
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkImage, setBulkImage] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState<HistoryFilters>({
    customer_id: searchParams.get("customer_id") || "",
    start_date: searchParams.get("start_date") || "",
    end_date: searchParams.get("end_date") || "",
    query: searchParams.get("query") || "",
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const fetchHistory = useCallback(async (currentFilters: HistoryFilters) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(
          ([, value]) => value !== "" && value !== null
        )
      );
      const response = await api.get("/api/admin/line-history/", {
        params: cleanFilters,
      });
      setMessages(response.data);
    } catch (error) {
      console.error("履歴の取得に失敗:", error);
    }
  }, []);

  useEffect(() => {
    fetchHistory(filters);
  }, [fetchHistory, filters]);

  useEffect(() => {
    // 新しいメッセージが読み込まれたら一番下までスクロール
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDateChange = (
    key: "start_date" | "end_date",
    date: Date | null
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: date ? format(date, "yyyy-MM-dd") : "",
    }));
  };

  // 一括送信API
  const handleBulkSend = async () => {
    if (!bulkMessage && !bulkImage) return;
    setIsSending(true);
    try {
      const formData = new FormData();
      if (bulkMessage) formData.append("text", bulkMessage);
      if (bulkImage) formData.append("image", bulkImage);
      await api.post("/api/admin/send-bulk-message/", formData);
      alert("全顧客に送信しました");
      setBulkMessage("");
      setBulkImage(null);
    } catch (e) {
      alert("送信に失敗しました");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white p-0 sm:p-6 rounded-lg shadow-md min-h-screen flex flex-col">
      {/* ヘッダーをstickyで固定 */}
      <div className="sticky top-0 z-10 bg-white pb-2">
        <div className="flex justify-between items-center mb-4 px-4 pt-4 sm:px-0 sm:pt-0">
          <h2 className="text-2xl font-bold whitespace-nowrap">
            LINE メッセージ履歴
          </h2>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
          >
            {isFilterOpen ? (
              <ChevronUp size={16} />
            ) : (
              <SlidersHorizontal size={16} />
            )}
            <span>検索フィルター</span>
          </button>
        </div>
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isFilterOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="p-4 border rounded-md mb-6 space-y-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                name="query"
                placeholder="顧客名や本文で検索..."
                value={filters.query}
                onChange={handleFilterChange}
                className="p-2 border rounded w-full"
              />
              <DatePicker
                selected={
                  filters.start_date ? new Date(filters.start_date) : null
                }
                onChange={(date) => handleDateChange("start_date", date)}
                placeholderText="開始日"
                className="p-2 border rounded w-full"
                locale={ja}
                dateFormat="yyyy/MM/dd"
              />
              <DatePicker
                selected={filters.end_date ? new Date(filters.end_date) : null}
                onChange={(date) => handleDateChange("end_date", date)}
                placeholderText="終了日"
                className="p-2 border rounded w-full"
                locale={ja}
                dateFormat="yyyy/MM/dd"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ▼▼▼【4. メッセージ表示部分を修正】▼▼▼ */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 border rounded-md bg-gray-100 space-y-4">
        {(() => {
          const rendered: JSX.Element[] = [];
          let prevDate: Date | null = null;
          const reversedMessages = messages.slice().reverse();

          reversedMessages.forEach((msg, idx) => {
            const msgDate = new Date(msg.sent_at);
            const showDate =
              !prevDate || !isSameDay(msgDate, prevDate) || idx === 0;

            if (showDate) {
              rendered.push(
                <div
                  key={`date-${msg.id}`}
                  className="flex justify-center my-2"
                >
                  <span className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full shadow">
                    {format(msgDate, "yyyy年MM月dd日 (EEE)", { locale: ja })}
                  </span>
                </div>
              );
            }

            rendered.push(
              <div
                key={msg.id}
                className={`flex gap-2 items-end ${
                  msg.sender_type === "admin" ? "justify-end" : "justify-start"
                }`}
              >
                {/* 管理者の場合は左に日時 */}
                {msg.sender_type === "admin" && (
                  <div className="flex flex-col items-end justify-center min-w-[60px]">
                    <span className="text-xs text-gray-500">
                      {format(new Date(msg.sent_at), "HH:mm")}
                    </span>
                  </div>
                )}

                {/* 顧客からのメッセージの場合のみアイコンを表示 */}
                {msg.sender_type === "customer" &&
                  (msg.customer_line_picture_url ? (
                    <img
                      src={msg.customer_line_picture_url}
                      alt="icon"
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={20} />
                    </div>
                  ))}

                {/* メッセージ本体＋時間（横並び） */}
                <div className="flex flex-row items-end gap-2">
                  <div
                    className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow-sm ${
                      msg.sender_type === "admin"
                        ? "bg-blue-500 text-white"
                        : "bg-white"
                    }`}
                  >
                    {/* 1行目：宛名表示 */}
                    <div
                      className={`mb-1 text-xs font-bold ${
                        msg.sender_type === "admin"
                          ? "bg-blue-500 text-white"
                          : "bg-white"
                      }`}
                    >
                      {!msg.customer_name || msg.customer_name.trim() === ""
                        ? "一括"
                        : msg.sender_type === "admin"
                        ? `${msg.customer_name}様宛`
                        : `${msg.customer_name}様`}
                    </div>
                    {/* メッセージ本文 */}
                    {msg.message && (
                      <p className="whitespace-pre-wrap text-xs sm:text-sm">
                        {msg.message}
                      </p>
                    )}
                    {/* 画像 */}
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="送信された画像"
                        className="rounded-md mt-2 cursor-pointer"
                        style={{
                          maxWidth: "180px",
                          maxHeight: "180px",
                          width: "auto",
                          height: "auto",
                        }}
                        onClick={() => {
                          if (msg.image_url) {
                            window.open(msg.image_url, "_blank");
                          }
                        }}
                      />
                    )}
                  </div>
                  {/* 顧客の場合は右に時間 */}
                  {msg.sender_type === "customer" && (
                    <span className="text-xs text-gray-500 mb-1">
                      {format(new Date(msg.sent_at), "HH:mm")}
                    </span>
                  )}
                </div>
              </div>
            );
            prevDate = msgDate;
          });
          return rendered;
        })()}
        <div ref={messagesEndRef} />
        </div>
        <div className="fixed bottom-0 left-0 w-full flex flex-col items-center bg-white border-t pt-4 pb-6 z-50">
          {!isBulkFormOpen ? (
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-full shadow-lg font-bold hover:bg-green-700"
              onClick={() => setIsBulkFormOpen(true)}
            >
              一括送信
            </button>
          ) : (
            <form
              className="w-full max-w-md bg-white p-4 rounded-lg shadow-xl flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleBulkSend();
              }}
            >
              <h3 className="text-lg font-bold mb-2">全顧客にLINE一括送信</h3>
              <textarea
                className="w-full p-2 border rounded"
                rows={4}
                placeholder="メッセージ本文"
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                className="mb-2"
                onChange={(e) => setBulkImage(e.target.files?.[0] || null)}
              />
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={() => setIsBulkFormOpen(false)}
                  disabled={isSending}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded font-bold"
                  disabled={isSending}
                >
                  {isSending ? "送信中..." : "送信"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LineHistoryPage;
