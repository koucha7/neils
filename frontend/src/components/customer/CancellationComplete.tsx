// frontend/src/components/CancellationComplete.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const CancellationComplete: React.FC = () => {
    return (
        <div className="container mx-auto p-10 text-center bg-white rounded-lg shadow-xl mt-10">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-6">
                ご予約のキャンセルが完了しました
            </h2>
            <p className="text-lg text-gray-600 mb-8">
                またのご利用を心よりお待ちしております。
            </p>
            <Link 
                to="/" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 text-xl shadow-md hover:shadow-lg"
            >
                トップページに戻る
            </Link>
        </div>
    );
};

export default CancellationComplete;