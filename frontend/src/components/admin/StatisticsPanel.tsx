import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface MonthlySales {
  labels: string[];
  data: number[];
}

interface ServiceRanking {
  labels: string[];
  data: number[];
}

interface ReservationStats {
  [key: string]: number;
}

const StatisticsPanel = () => {
  const [monthlySales, setMonthlySales] = useState<MonthlySales | null>(null);
  const [serviceRanking, setServiceRanking] = useState<ServiceRanking | null>(null);
  const [reservationStats, setReservationStats] = useState<ReservationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/statistics/');
        setMonthlySales(response.data.monthly_sales);
        setServiceRanking(response.data.service_ranking);
        setReservationStats(response.data.reservation_stats);
      } catch (err) {
        setError('統計データの取得に失敗しました。');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) return <div className="text-center p-8">読み込み中...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  const salesChartData = {
    labels: monthlySales?.labels || [],
    datasets: [
      {
        label: '月別売上',
        data: monthlySales?.data || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const serviceChartData = {
    labels: serviceRanking?.labels || [],
    datasets: [
      {
        data: serviceRanking?.data || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      <h2 className="text-lg font-bold text-gray-800">統計情報</h2>
      
      {/* 予約ステータス */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-600">完了した予約</h3>
          <p className="text-3xl font-semibold text-green-500">{reservationStats?.confirmed || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-600">保留中の予約</h3>
          <p className="text-3xl font-semibold text-yellow-500">{reservationStats?.pending || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-gray-600">キャンセルされた予約</h3>
          <p className="text-3xl font-semibold text-red-500">{reservationStats?.cancelled || 0}</p>
        </div>
      </div>

      {/* グラフエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4 text-gray-700">月別売上</h3>
          {monthlySales && <Bar data={salesChartData} />}
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4 text-gray-700">人気サービス Top 5</h3>
          {serviceRanking && <Pie data={serviceChartData} />}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPanel;