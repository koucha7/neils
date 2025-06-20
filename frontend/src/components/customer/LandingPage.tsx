import { Link } from 'react-router-dom';

function LandingPage() {
  const handleLineLogin = () => {
    // CSRF対策のためのランダムな文字列を生成
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("line_login_state", state);

    // 環境変数からLINEログインの設定を読み込む
    const channelId = import.meta.env.VITE_LINE_LOGIN_CHANNEL_ID;
    const callbackUrl = import.meta.env.VITE_LINE_CALLBACK_URL;

    if (!channelId || !callbackUrl) {
      alert("LINEログインの設定が正しくありません。管理者にお問い合わせください。");
      return;
    }

    // LINEログインの認可URLを組み立てる
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${callbackUrl}&state=${state}&scope=openid%20profile%20email&bot_prompt=aggressive`;
    
    // 組み立てたURLにページを遷移させる
    window.location.href = lineLoginUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex flex-col justify-center items-center p-4">
      <header className="text-center text-white mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight">NailMomo</h1>
      </header>

      <main className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-8">
        
        {/* ▼▼▼ 「今すぐ予約する」をLINEログインボタンに変更 ▼▼▼ */}
        <button 
          onClick={handleLineLogin} 
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition duration-300 ease-in-out flex items-center justify-center text-xl font-semibold"
        >
          <svg className="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.2,0 H3.8C1.7,0,0,1.7,0,3.8v11.1c0,2.1,1.7,3.8,3.8,3.8h3.4v2.8c0,0.5,0.5,0.9,1,0.9c0.2,0,0.5-0.1,0.6-0.2l3.5-3.5h7.9c2.1,0,3.8-1.7,3.8-3.8V3.8C24,1.7,22.3,0,20.2,0z" fill="#fff"/></svg>
          LINEでログインして予約
        </button>
      </main>
    </div>
  );
}

export default LandingPage;
