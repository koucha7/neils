import React, { useState } from 'react';

const ManualAccordion = ({ title, emoji, children, id, isOpen, toggleAccordion }: { title: string, emoji: string, children: React.ReactNode, id: string, isOpen: boolean, toggleAccordion: (id: string) => void }) => {
    return (
        <div className="accordion-item bg-white rounded-lg shadow-sm">
            <button
                onClick={() => toggleAccordion(id)}
                className="accordion-button w-full flex justify-between items-center p-5 text-left text-xl font-semibold"
            >
                <span>{emoji} {title}</span>
                <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <div
                style={{ maxHeight: isOpen ? '1000px' : '0' }}
                className="accordion-content overflow-hidden transition-all duration-500 ease-in-out"
            >
                <div className="p-5 border-t border-gray-200 text-gray-700 space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
};


const Manual = () => {
    const [activeTab, setActiveTab] = useState('customer');
    const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({});

    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="bg-gray-50 text-gray-800 min-h-screen py-8">
            <div className="container mx-auto max-w-4xl p-4 sm:p-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900">NailMomo ご利用マニュアル</h1>
                    <p className="mt-2 text-lg text-gray-600">ネイルサロン予約システム「NailMomo」の操作マニュアルです。</p>
                </header>

                <div className="mb-8 border-b border-gray-200">
                    <nav className="flex justify-center -mb-px space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('customer')}
                            className={`tab-button whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200 ${activeTab === 'customer' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            👤 お客様向け
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`tab-button whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200 ${activeTab === 'admin' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                        >
                            ⚙️ 管理者様向け
                        </button>
                    </nav>
                </div>

                <main>
                    {activeTab === 'customer' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-2xl font-bold mb-4">お客様向け機能</h2>
                                <p>Webサイトからネイルサービスの予約、予約内容の確認、およびキャンセルを行うことができます。</p>
                            </div>
                            <ManualAccordion title="1.1. ご予約方法" emoji="💅" id="c1" isOpen={!!openAccordions['c1']} toggleAccordion={toggleAccordion}>
                                <ol className="list-decimal list-inside space-y-3">
                                    <li><strong>サービスの選択:</strong> トップページの「予約する」ボタン、または予約ページにアクセスします。提供されているサービス（メニュー）の一覧が表示されますので、ご希望のサービスを選択してください。</li>
                                    <li><strong>日時の選択:</strong> カレンダーが表示されます。予約可能な日付がクリックできるようになっています。希望の日にちを選択すると、その日に予約可能な時間帯の候補が表示されます。ご希望の時間を選択してください。</li>
                                    <li><strong>お客様情報の入力:</strong> お名前（姓・名）、メールアドレス、電話番号を入力します。すべての情報を入力したら、「予約内容を確認する」ボタンをクリックします。</li>
                                    <li><strong>予約内容の確認と完了:</strong> 選択したサービス、日時、入力したお客様情報が表示されます。内容に間違いがなければ、「この内容で予約する」ボタンをクリックして予約を完了します。完了後、入力したメールアドレスに予約内容の確認メールが自動で送信されます。</li>
                                </ol>
                            </ManualAccordion>
                            <ManualAccordion title="1.2. 予約の確認・キャンセル方法" emoji="📝" id="c2" isOpen={!!openAccordions['c2']} toggleAccordion={toggleAccordion}>
                               <ol className="list-decimal list-inside space-y-3">
                                    <li><strong>予約確認ページへのアクセス:</strong> トップページの「予約を確認する」ボタン、または予約確認ページにアクセスします。</li>
                                    <li><strong>予約番号の入力:</strong> 予約完了時に発行された「予約番号」を入力し、「予約を検索」ボタンをクリックします。</li>
                                    <li><strong>予約詳細の表示とキャンセル:</strong> 予約内容の詳細が表示されます。予約をキャンセルする場合は、「この予約をキャンセルする」ボタンをクリックしてください。キャンセルが完了すると、確認画面が表示され、手続きは終了です。</li>
                                </ol>
                            </ManualAccordion>
                        </div>
                    )}

                    {activeTab === 'admin' && (
                        <div className="space-y-6">
                             <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h2 className="text-2xl font-bold mb-4">管理者様向け機能</h2>
                                <p>専用の管理画面から予約の管理、売上やサービスの統計分析、サロンのスケジュール設定など、システムの全ての機能を操作できます。</p>
                            </div>
                            <ManualAccordion title="2.1. ログイン方法" emoji="🔑" id="a1" isOpen={!!openAccordions['a1']} toggleAccordion={toggleAccordion}>
                                <ol className="list-decimal list-inside space-y-3">
                                    <li>サイトのURLの末尾に `/admin` をつけてアクセスします。（例: `https://your-domain.com/admin`）</li>
                                    <li>指定された「ユーザー名」と「パスワード」を入力してログインします。</li>
                                    <li>認証に失敗した場合や、セッションの有効期限が切れた場合は、自動的にこのログイン画面に戻ります。</li>
                                </ol>
                            </ManualAccordion>
                            <ManualAccordion title="2.2. 管理画面の機能一覧" emoji="📋" id="a2" isOpen={!!openAccordions['a2']} toggleAccordion={toggleAccordion}>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-bold text-lg">2.2.1. 予約確認</h4>
                                        <p>新しい予約の確認や、既存の予約の管理を行います。</p>
                                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                            <li><strong>一覧表示:</strong> 指定した期間とステータス（保留中、確定済みなど）で予約を絞り込んで表示できます。</li>
                                            <li><strong>予約の確定:</strong> 「保留中」の予約に対して「確定」ボタンを押すと、お客様に予約確定メールが送信され、Googleカレンダーにも予定が自動で登録されます。</li>
                                            <li><strong>予約のキャンセル:</strong> 各予約の「取消」ボタンから、予約をキャンセルすることができます。</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">2.2.2. 休日管理</h4>
                                        <p>サロンの営業日や営業時間を設定します。</p>
                                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                            <li><strong>基本スケジュール:</strong> 曜日ごとの基本的な定休日と営業時間を設定します。</li>
                                            <li><strong>特別スケジュール:</strong> 年末年始の休業や臨時営業など、特定の日付に対して、基本スケジュールとは異なる営業設定（休業、特別営業時間）を追加・編集できます。</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">2.2.3. メニュー管理</h4>
                                        <p>お客様に提供するサービス（メニュー）の管理を行います。</p>
                                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                            <li><strong>追加:</strong> 「新規追加」ボタンから、新しいサービスの「メニュー名」「料金」「所要時間」を登録できます。</li>
                                            <li><strong>編集・削除:</strong> 既存の各サービス内容を編集したり、提供を終了したサービスを削除したりすることができます。</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">2.2.4. 通知設定</h4>
                                        <p>管理者様へのリマインダー通知を設定します。</p>
                                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                            <li><strong>予約未確定リマインダー:</strong> お客様からの予約が「保留中」のままになっている場合、予約日の何日前に通知を受け取るかを設定できます。</li>
                                            <li><strong>スケジュールリマインダー:</strong> 指定した日数後の予約状況を、リマインダーとして受け取る設定ができます。</li>
                                        </ul>
                                    </div>
                                     <div>
                                        <h4 className="font-bold text-lg">2.2.5. キャンセルポリシー</h4>
                                        <p>お客様がご自身で予約をキャンセルできる期限を設定します。</p>
                                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                            <li>例えば「2」と設定すると、お客様は予約日の2日前（前々日）まで、ご自身でキャンセル手続きが可能になります。それ以降のキャンセルは、管理者様が管理画面から行う必要があります。</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">2.2.6. 統計</h4>
                                        <p>サロンの運営状況をグラフで視覚的に確認できます。</p>
                                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                                            <li><strong>月別売上:</strong> 確定済みの予約に基づいて、月ごとの売上合計を棒グラフで表示します。</li>
                                            <li><strong>人気サービス Top 5:</strong> 予約数が多い順に、上位5つの人気サービスを円グラフで表示します。</li>
                                            <li><strong>予約ステータス集計:</strong> 「完了」「保留中」「キャンセル」の予約数を数値で表示します。</li>
                                        </ul>
                                    </div>
                                </div>
                            </ManualAccordion>
                            <ManualAccordion title="2.3. ログアウト" emoji="🚪" id="a3" isOpen={!!openAccordions['a3']} toggleAccordion={toggleAccordion}>
                                <p>サイドバーの一番下にある「ログアウト」ボタンをクリックすると、安全に管理画面からログアウトできます。</p>
                            </ManualAccordion>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Manual;