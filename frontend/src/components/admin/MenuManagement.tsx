import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle} from 'lucide-react';
import axios from 'axios';
import api from '../../api/axiosConfig';

interface Service {
  id: number;
  salon: number;
  name: string;
  price: string;
  duration_minutes: number;
}

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
      <div className="bg-white p-4 rounded-lg shadow">
        {/* Service Table */}
      </div>
    </div>
  );
};

const ServiceForm: React.FC<{ service: Partial<Service>, onSave: (s: Partial<Service>) => void, onCancel: () => void, DURATION_CHOICES: number[] }> = ({ service, onSave, onCancel, DURATION_CHOICES }) => {
    // Form component logic here
    // This is kept separate for clarity
    return <div>...</div> // Placeholder for form JSX
};


export default MenuManagement;
