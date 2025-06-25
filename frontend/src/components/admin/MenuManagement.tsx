import React, { useState, useEffect, useCallback } from 'react';
// ★ 1. EditとTrash2アイコンをインポート
import { PlusCircle, Edit, Trash2 } from 'lucide-react'; 
import axios from 'axios';
import api from '../../api/axiosConfig';

interface Service {
  id: number;
  salon: number;
  name: string;
  price: string;
  duration_minutes: number;
}

// （ServiceFormコンポーネントは、前の回答で提供した実装済みのものを使用している前提です）
const ServiceForm: React.FC<{ service: Partial<Service>, onSave: (s: Partial<Service>) => void, onCancel: () => void, DURATION_CHOICES: number[] }> = ({ service, onSave, onCancel, DURATION_CHOICES }) => {
    
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
        className="bg-gray-50 p-6 my-4 rounded-lg shadow-md space-y-4 border border-gray-200"
      >
        <h3 className="text-xl font-semibold text-gray-800">
          {service.id ? "メニュー編集" : "新規メニュー追加"}
        </h3>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">メニュー名</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">料金 (円)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price || ""}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700">所要時間</label>
          <select
            id="duration_minutes"
            name="duration_minutes"
            value={formData.duration_minutes || 90}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {DURATION_CHOICES.map((d) => (
              <option key={d} value={d}>
                {d} 分
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </form>
    );
};

const MenuManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
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
      if (serviceToSave.id) {
        await api.patch(`/api/services/${serviceToSave.id}/`, payload);
      } else {
        await api.post("/api/services/", payload);
      }
      setEditingService(null);
      await fetchServices();
    } catch (err) {
      alert(`保存に失敗しました: ${axios.isAxiosError(err) && err.response ? JSON.stringify(err.response.data) : "不明なエラー"}`);
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

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">メニュー管理</h2>
        <button onClick={() => setEditingService({ name: "", price: "0", duration_minutes: 90 })} className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          <PlusCircle size={20} className="mr-2" /> 新規追加
        </button>
      </div>
      {editingService && <ServiceForm service={editingService} onSave={handleSave} onCancel={() => setEditingService(null)} DURATION_CHOICES={DURATION_CHOICES} />}
      
      {/* ★ 2. Service Table の実装 */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">メニュー名</th>
              <th className="p-3">料金</th>
              <th className="p-3">所要時間(分)</th>
              <th className="p-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{service.name}</td>
                <td className="p-3">{parseInt(service.price).toLocaleString()}円</td>
                <td className="p-3">{service.duration_minutes}</td>
                <td className="p-3 text-center space-x-4">
                  <button
                    onClick={() => setEditingService(service)}
                    className="text-blue-600 hover:text-blue-800"
                    aria-label="編集"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600 hover:text-red-800"
                    aria-label="削除"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MenuManagement;