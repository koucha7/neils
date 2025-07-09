// frontend/src/components/admin/LineHistoryPage.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { format } from 'date-fns';
import { User, Image as ImageIcon, SlidersHorizontal, ChevronUp } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ja } from 'date-fns/locale/ja';

// 型定義
interface Message {
  id: string;
  customer: number;
  customer_name: string;
  customer_line_picture_url: string | null;
  sender_type: 'customer' | 'admin';
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
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<HistoryFilters>({
    customer_id: searchParams.get('customer_id') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    query: searchParams.get('query') || '',
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const fetchHistory = useCallback(async (currentFilters: HistoryFilters) => {
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(([, value]) => value !== '' && value !== null)
      );
      const response = await api.get('/api/admin/line-history/', { params: cleanFilters });
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
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDateChange = (key: 'start_date' | 'end_date', date: Date | null) => {
    setFilters(prev => ({ ...prev, [key]: date ? format(date, 'yyyy-MM-dd') : '' }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">LINE メッセージ履歴</h2>
        {/* ▼▼▼【2. フィルター開閉ボタンを追加】▼▼▼ */}
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
        >
          {isFilterOpen ? <ChevronUp size={16} /> : <SlidersHorizontal size={16} />}
          <span>検索フィルター</span>
        </button>
      </div>
      
      {/* ▼▼▼【3. 検索部分をアコーディオン対応】▼▼▼ */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="p-4 border rounded-md mb-6 space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input type="text" name="query" placeholder="顧客名や本文で検索..." value={filters.query} onChange={handleFilterChange} className="p-2 border rounded w-full" />
            <DatePicker selected={filters.start_date ? new Date(filters.start_date) : null} onChange={(date) => handleDateChange('start_date', date)} placeholderText="開始日" className="p-2 border rounded w-full" locale={ja} dateFormat="yyyy/MM/dd"/>
            <DatePicker selected={filters.end_date ? new Date(filters.end_date) : null} onChange={(date) => handleDateChange('end_date', date)} placeholderText="終了日" className="p-2 border rounded w-full" locale={ja} dateFormat="yyyy/MM/dd"/>
          </div>
        </div>
      </div>

      {/* ▼▼▼【4. メッセージ表示部分を修正】▼▼▼ */}
      <div className="h-[60vh] overflow-y-auto p-4 border rounded-md bg-gray-100 space-y-4">
        {messages.map(msg => (
          // 送信者によって左右の配置を切り替える
          <div key={msg.id} className={`flex items-end gap-3 ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
            {/* 顧客からのメッセージの場合のみアイコンを表示 */}
            {msg.customer_line_picture_url ? (
              <img src={msg.customer_line_picture_url} alt="icon" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"><User size={20}/></div>
            )}
            {/* メッセージ本体 */}
            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow-sm ${msg.sender_type === 'admin' ? 'bg-blue-500 text-white' : 'bg-white'}`}>
              {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}
              {/* msg.image_urlが存在する場合のみimgタグを描画する */}
              {msg.image_url && (
                  <img 
                      src={msg.image_url} 
                      alt="送信された画像" 
                      className="rounded-md max-w-full h-auto mt-2 cursor-pointer" 
                      onClick={() => {
                          if (msg.image_url) {
                              window.open(msg.image_url, '_blank');
                          }
                      }} 
                  />
              )}
              <p className={`text-xs mt-1 text-right ${msg.sender_type === 'admin' ? 'text-blue-200' : 'text-gray-500'}`}>
                {format(new Date(msg.sent_at), 'HH:mm')}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default LineHistoryPage;