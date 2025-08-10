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
    const fetchCustomer = async () => {
      try {
        const response = await api.get(`/api/admin/customers/${customerId}/`);
        setCustomerName(response.data.name);
      } catch (error) {
        console.error("顧客情報の取得に失敗しました:", error);
        setCustomerName('顧客');
      }
    };
    fetchCustomer();
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
    // ファイル選択インプットもリセットする
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !imageFile) {
      alert('メッセージまたは画像を入力してください。');
      return;
    }
    // window.confirmは本番環境ではより良いUIに置き換えることを検討してください
    if (!window.confirm("この内容で送信しますか？")) return;
    
    setIsSending(true);
    
    const formData = new FormData();
    
    // ▼▼▼【ここを修正】▼▼▼
    // バックエンドの`request.data.get('text')`に合わせてキーを'text'に変更
    if (message.trim()) {
      formData.append('text', message);
    }
    // ▲▲▲【修正ここまで】▲▲▲
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      // axiosConfigでContent-Typeは自動設定されるので、ここでは指定不要
      await api.post(`/api/admin/customers/${customerId}/send-message/`, formData);
      alert('メッセージを送信しました。');
      navigate(`/admin/customers/${customerId}`);
    } catch (error: any) {
      console.error("メッセージ送信エラー:", error.response);
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
        <h2 className="text-lg font-bold whitespace-nowrap">{customerName}様にLINEを送信</h2>
      </div>

      {/* テキスト入力欄 */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={8}
        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        placeholder="送信するメッセージを入力..."
        disabled={isSending}
      />

      <div className="mt-4">
        <label htmlFor="image-upload" className="inline-flex items-center gap-2 text-blue-600 cursor-pointer hover:underline font-semibold">
          <ImageIcon size={20} />
          画像を添付する
        </label>
        <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
      </div>

      {/* 画像プレビュー */}
      {imagePreview && (
        <div className="mt-4 relative w-40 h-40">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md shadow-sm"/>
          <button 
            onClick={clearImage} 
            className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            aria-label="画像を削除"
          >
            <XCircle size={20}/>
          </button>
        </div>
      )}

      {/* 送信ボタン */}
      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleSend} 
          className="flex items-center justify-center bg-green-500 text-white px-6 py-3 rounded-md font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out shadow-md hover:shadow-lg"
          disabled={isSending || (!message.trim() && !imageFile)}
        >
          <Send size={18} className="mr-2" />
          {isSending ? '送信中...' : '送信する'}
        </button>
      </div>
    </div>
  );
};

export default SendLineMessage;
