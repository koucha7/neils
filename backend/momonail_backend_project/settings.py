# MomoNail/backend/momonail_backend_project/settings.py
import os
import dj_database_url # ★追加

from pathlib import Path

DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') # ★環境変数から読み込む (Renderで設定)

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',') # ★環境変数で設定 (Renderで設定)

BASE_DIR = Path(__file__).resolve().parent.parent

ROOT_URLCONF = 'momonail_backend_project.urls'

LANGUAGE_CODE = 'ja'

# DATABASE_URL 環境変数から読み込む
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3'), # RenderのDBサービスに接続
        conn_max_age=600 # 接続の最大有効期間
    )
}

# CORS設定 (settings.py のどこか)
# INSTALLED_APPS と MIDDLEWARE に 'corsheaders' が含まれていることを確認
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
# 本番環境ではフロントエンドの公開URLを設定 (Renderで設定)
# 例: CORS_ALLOWED_ORIGINS = ['https://your-frontend-app.onrender.com']

# 静的ファイル設定 (本番用)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles') # 'staticfiles' ディレクトリに収集
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage' # Whitenoise用

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles', # ← この行が追加されているか確認！
    'rest_framework',
    'rest_framework_simplejwt', # ★追加
    'corsheaders',
    'reservations',  # この行が追加されているか確認！
    # あなたのカスタムアプリなど
    # 'your_app_name',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # ★この位置を確認★
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'corsheaders.middleware.CorsMiddleware', # ★この位置を確認★
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates', # これが重要です
        'DIRS': [
            # あなたのプロジェクトのテンプレートディレクトリがあればここに追加
            # os.path.join(BASE_DIR, 'templates'),
        ],
        'APP_DIRS': True, # これにより、各アプリのtemplatesディレクトリが自動的にロードされます
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# REST Frameworkの設定
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # APIへのアクセスはJWT認証を基本とする
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # ★★★ この行を追加 ★★★
    # 認証エンドポイントでは、標準のセッション認証も許可する
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# Google Calendar API & LINE API Keys
GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID')
LINE_CHANNEL_ACCESS_TOKEN = os.environ.get('LINE_CHANNEL_ACCESS_TOKEN')
LINE_USER_ID = os.environ.get('LINE_USER_ID')

# メールの設定 (Gmailを使う例)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER') # 環境変数で設定
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD') # 環境変数で設定
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@yourdomain.com')
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60), # アクセストークンの有効期間
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),   # リフレッシュトークンの有効期間
}

# CORSの設定
CORS_ALLOWED_ORIGINS = [
    "https://momonail-frontend.onrender.com", # 本番フロントエンド
    "http://localhost:5173",                 # ローカル開発用フロントエンド
]
