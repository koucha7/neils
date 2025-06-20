import React from 'react';
import { Link } from 'react-router-dom';

const LoginFailed: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center text-center p-4">
      <h1 className="text-4xl font-bold text-red-600 mb-4">ログインに失敗しました</h1>
      <p className="text-gray-700 mb-8">
        LINEログイン処理中にエラーが発生しました。時間をおいてもう一度お試しください。
      </p>
      <Link 
        to="/" 
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
      >
        トップページに戻る
      </Link>
    </div>
  );
};

export default LoginFailed;