import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';

const CancellationPolicyManagement: React.FC = () => {
  const [deadline, setDeadline] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 whitespace-nowrap">キャンセルポリシー設定</h2>
      <div className="bg-white p-6 rounded-lg shadow max-w-lg">
        {/* Cancellation policy form JSX here */}
      </div>
    </div>
  );
};

export default CancellationPolicyManagement;
