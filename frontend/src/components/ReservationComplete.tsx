// MomoNail/frontend/src/components/ReservationComplete.tsx

import React from 'react';
import { useParams, Link } from 'react-router-dom'; // URLパラメータ取得とリンク用

const ReservationComplete: React.FC = () => {
    // URLのパスから予約番号を取得
    const { reservationNumber } = useParams<{ reservationNumber: string }>();

    return (
        <div className="container mx-auto p-10 text-center bg-white rounded-lg shadow-xl mt-10">
            <h2 className="text-4xl font-extrabold text-green-600 mb-6">予約が完了しました！ 🎉</h2>
            <p className="text-xl mb-4 text-gray-800">ご予約ありがとうございます。以下の内容で承りました。</p>
            {/* 予約番号の表示 */}
            <p className="text-3xl font-semibold text-blue-700 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                あなたの予約番号: <span className="font-extrabold text-purple-800 break-all">{reservationNumber}</span>
            </p>
            <p className="text-gray-700 text-lg mb-8">
                予約内容は、ご登録いただいたメールアドレスに確認メールとして送信されました。<br />
                この予約番号は、後で予約内容の確認や変更、キャンセルを行う際に必要になりますので、お控えください。
            </p>
            {/* ナビゲーションリンク */}
            <div className="space-y-4">
                <Link to="/reserve" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-xl shadow-md hover:shadow-lg">
                    続けて別の予約をする
                </Link>
                <Link to="/" className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200 text-xl shadow-md hover:shadow-lg">
                    トップページに戻る
                </Link>
                {/* 将来的に、予約番号で予約詳細にアクセスできる機能へのリンク */}
                {/* <Link to={`/my-reservation/${reservationNumber}`} className="block w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 text-xl shadow-md hover:shadow-lg">
                    予約内容を確認する
                </Link> */}
            </div>
        </div>
    );
};

export default ReservationComplete;