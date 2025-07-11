// frontend/src/components/admin/SendLineMessage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { ArrowLeft, Send, Image as ImageIcon, XCircle } from 'lucide-react';

const SendLineMessage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customerName, setCustomerName] = useState('');
  const [message, setMessage] = useState('');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ... (顧客名取得のロジックは変更なし)
  }, [customerId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // 画像プレビューを生成
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSend = async () => {
    if (!message.trim() && !imageFile) {
      alert('メッセージまたは画像を入力してください。');
      return;
    }
    if (!window.confirm("この内容で送信しますか？")) return;
    
    setIsSending(true);
    
    // FormDataを使ってテキストと画像を一緒に送信
    const formData = new FormData();
    formData.append('message', message);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      await api.post(`/api/admin/customers/${customerId}/send-message/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('メッセージを送信しました。');
      navigate(`/admin/customers/${customerId}`);
    } catch (error: any) {
      alert(`メッセージの送信に失敗しました: ${error.response?.data?.error || 'サーバーエラー'}`);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(`/admin/customers/${customerId}`)} className="p-2 hover:bg-gray-100 rounded-full mr-4">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">{customerName}様にLINEを送信</h2>
      </div>

      {/* テキスト入力欄 */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={8}
        className="w-full p-3 border rounded-md"
        placeholder="送信するメッセージを入力..."
        disabled={isSending}
      />

      <div className="mt-4">
        <label htmlFor="image-upload" className="flex items-center gap-2 text-blue-600 cursor-pointer hover:underline">
          <ImageIcon size={20} />
          画像を添付する
        </label>
        <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
      </div>

      {/* 画像プレビュー */}
      {imagePreview && (
        <div className="mt-4 relative w-40 h-40">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md"/>
          <button onClick={clearImage} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1">
            <XCircle size={18}/>
          </button>
        </div>
      )}

      {/* 送信ボタン */}
      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleSend} 
          className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400"
          disabled={isSending}
        >
          <Send size={18} className="mr-2" />
          {isSending ? '送信中...' : '送信する'}
        </button>
      </div>
    </div>
  );
};

export default SendLineMessage;