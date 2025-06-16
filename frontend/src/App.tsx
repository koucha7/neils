// MomoNail/frontend/src/App.tsx の例
// import React from 'react'; // ★この行を削除またはコメントアウト
import './App.css';
import { Link } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex flex-col justify-center items-center p-4">
      <header className="text-center text-white mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight">NailMomo</h1>
      </header>

      <main className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
        <Link to="/reserve" className="bg-white text-indigo-700 px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition duration-300 ease-in-out flex items-center justify-center text-xl font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          今すぐ予約する
        </Link>
        <Link to="/check" className="bg-white text-purple-700 px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition duration-300 ease-in-out flex items-center justify-center text-xl font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          予約を確認
        </Link>
      </main>
    </div>
  );
}

export default App;