import React from 'react';
import { Link } from 'react-router-dom';

const Manual: React.FC = () => {
    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-4xl bg-white rounded-lg shadow-md my-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">操作マニュアル</h1>

            {/* お客様向けマニュアル */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">■ お客様向けマニュアル</h2>

                <div className="space-y-6">
                    {/* 予約方法 */}
                    <div>
                        <h3 className="text-xl font-semibold text-blue-600 mb-3">1. ご予約の方法</h3>
                        <ol className="list-decimal list-inside space-y-3 bg-gray-50 p-4 rounded-lg">
                            <li>
                                <strong>メニューの選択:</strong>
                                <p className="ml-4 text-gray-600">トップページに表示されているメニューリストから、ご希望のサービスを選択します。</p>
                            </li>
                            <li>
                                <strong>日付の選択:</strong>
                                <p className="ml-4 text-gray-600">カレンダーが表示されますので、ご希望の予約日を選択してください。</p>
                            </li>
                            <li>
                                <strong>時間の選択:</strong>
                                <p className="ml-4 text-gray-600">選択した日付で予約可能な時間帯が一覧表示されます。ご希望の時間を選択します。</p>
                            </li>
                            <li>
                                <strong>お客様情報の入力:</strong>
                                <p className="ml-4 text-gray-600">お名前、メールアドレス、電話番号（任意）を入力します。</p>
                            </li>
                            <li>
                                <strong>予約内容の確認:</strong>
                                <p className="ml-4 text-gray-600">入力内容と予約サービス、日時、キャンセルポリシーが表示されます。内容に間違いがないかご確認ください。</p>
                            </li>
                            <li>
                                <strong>予約の確定:</strong>
                                <p className="ml-4 text-gray-600">「この内容で予約する」ボタンを押すと予約が完了します。予約番号が記載された完了画面が表示され、確認メールが自動送信されます。</p>
                            </li>
                        </ol>
                    </div>

                    {/* 予約の確認・キャンセル方法 */}
                    <div>
                        <h3 className="text-xl font-semibold text-blue-600 mb-3">2. ご予約の確認・キャンセル</h3>
                        <ol className="list-decimal list-inside space-y-3 bg-gray-50 p-4 rounded-lg">
                            <li>
                                <strong>予約確認ページへアクセス:</strong>
                                <p className="ml-4 text-gray-600">メニューの「<Link to="/check-reservation" className="text-blue-500 hover:underline">予約確認</Link>」にアクセスします。</p>
                            </li>
                            <li>
                                <strong>予約情報の入力:</strong>
                                <p className="ml-4 text-gray-600">予約完了時にお伝えした「予約番号」と、予約時に入力した「メールアドレス」を入力して検索します。</p>
                            </li>
                            <li>
                                <strong>予約内容の表示:</strong>
                                <p className="ml-4 text-gray-600">予約詳細が表示されます。</p>
                            </li>
                            <li>
                                <strong>キャンセル手続き:</strong>
                                <p className="ml-4 text-gray-600">キャンセル可能な期間内であれば、「予約をキャンセルする」ボタンが表示されます。ボタンを押すとキャンセルが完了し、確認メールが送信されます。</p>
                                <p className="ml-4 text-sm text-red-600 mt-1">※キャンセル期限を過ぎている場合はボタンが表示されません。直接店舗までご連絡ください。</p>
                            </li>
                        </ol>
                    </div>
                </div>
            </section>

            {/* 管理者向けマニュアル */}
            <section>
                <h2 className="text-2xl font-bold text-gray-700 mb-4">■ 管理者向けマニュアル</h2>
                <p className="mb-4 text-gray-600">管理画面（<Link to="/admin" className="text-blue-500 hover:underline">/admin</Link>）にアクセスし、設定されたIDとパスワードでログインしてください。</p>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-green-600 mb-3">1. 予約管理</h3>
                        <ul className="list-disc list-inside space-y-2 bg-green-50 p-4 rounded-lg">
                            <li><strong>予約の確認:</strong> カレンダーで日付を選択すると、その日の予約が一覧で表示されます。</li>
                            <li><strong>予約詳細:</strong> 一覧から特定の予約をクリックすると、お客様情報などの詳細を確認できます。</li>
                            <li><strong>強制キャンセル:</strong> 予約詳細画面から、管理者が手動で予約をキャンセルすることができます。</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-600 mb-3">2. サービス（メニュー）管理</h3>
                        <ul className="list-disc list-inside space-y-2 bg-green-50 p-4 rounded-lg">
                            <li><strong>追加:</strong> 新しいサービス（メニュー）の名前、価格、所要時間を設定して追加できます。</li>
                            <li><strong>編集/削除:</strong> 既存のサービス内容を変更したり、提供を終了したサービスを削除したりできます。</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-600 mb-3">3. 営業スケジュール設定</h3>
                         <ul className="list-disc list-inside space-y-2 bg-green-50 p-4 rounded-lg">
                            <li><strong>基本設定:</strong> 曜日ごとの定休日と、基本的な営業開始・終了時間を設定します。</li>
                            <li><strong>個別設定:</strong> 特定の日付に対して、臨時休業（祝日など）や、営業時間の変更（時短営業など）を設定することができます。カレンダーの日付をクリックして設定します。</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-600 mb-3">4. キャンセルポリシー設定</h3>
                         <ul className="list-disc list-inside space-y-2 bg-green-50 p-4 rounded-lg">
                            <li>「キャンセル期限」の項目で、「予約日の何日前までお客様自身でのキャンセルを許可するか」を設定します。例えば「1」と設定すると、予約日の前日までキャンセルが可能になります。</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-green-600 mb-3">5. 統計情報</h3>
                         <ul className="list-disc list-inside space-y-2 bg-green-50 p-4 rounded-lg">
                            <li>管理画面上部の「統計」タブからアクセスします。</li>
                            <li>月ごとの予約件数、売上合計を確認できます。</li>
                            <li>サービスごとの予約件数ランキングも表示され、人気のメニューを把握できます。</li>
                        </ul>
                    </div>
                </div>
            </section>
            
            <div className="mt-8 text-center">
                <Link to="/" className="text-blue-600 hover:underline">
                    トップページに戻る
                </Link>
            </div>
        </div>
    );
};

export default Manual;