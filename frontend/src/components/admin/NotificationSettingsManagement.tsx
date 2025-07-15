import React from 'react';

const StatisticsPanel: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 whitespace-nowrap">統計情報</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>ここに統計グラフや数値を表示します。</p>
      </div>
    </div>
  );
};

export default StatisticsPanel;
