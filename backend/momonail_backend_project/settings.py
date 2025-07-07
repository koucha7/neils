# MomoNail/backend/momonail_backend_project/settings.py
import os
import dj_database_url # ★追加
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv()
# ↓↓↓↓ この行を修正します ↓↓↓↓
# 修正前: load_dotenv() 
# 修正後:
#load_dotenv(os.path.join(BASE_DIR, '.env'))

DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'temporary-secret-key-for-building')

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
    'reservations',  # この行が追加されているか確認！
    'corsheaders',
    # あなたのカスタムアプリなど
    # 'your_app_name',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware', # ここに厳密に配置
    'whitenoise.middleware.WhiteNoiseMiddleware', # このミドルウェアはDjangoアプリが静的ファイルを配信する時に使われます
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware', # CORSがCSRFより前にあることを確認
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
        # あなたのカスタム認証クラスをここに追加します
        'reservations.authentication.CustomerJWTAuthentication', # ★この行を追加/変更
        'rest_framework_simplejwt.authentication.JWTAuthentication', # 必要であれば残す
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# Google Calendar API & LINE API Keys
GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID')
ADMIN_LINE_CHANNEL_ACCESS_TOKEN = os.environ.get('ADMIN_LINE_CHANNEL_ACCESS_TOKEN')
CUSTOMER_LINE_CHANNEL_ACCESS_TOKEN = os.environ.get('CUSTOMER_LINE_CHANNEL_ACCESS_TOKEN')
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
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id', # ★ 'line_user_id' に変更していた場合は元に戻す！
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
}

# 環境変数からCORS許可オリジンを取得
CORS_ALLOWED_ORIGINS_STR = os.environ.get('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_STR.split(',') if CORS_ALLOWED_ORIGINS_STR.strip() else []
"""
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]""" 

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# 全ての標準的なHTTPヘッダーを許可する
CORS_ALLOW_HEADERS = [
    'accept',
    'authorization',
    'content-type',
    'origin',
    'x-csrftoken',
    'x-requested-with',
]

# Renderなどの本番環境では、CSRF信頼済みオリジンも設定するとより安全です
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://momonail.onrender.com', # 本番環境用
]

CORS_ALLOW_CREDENTIALS = True

ALLOWED_HOSTS = ['*']

LOGIN_URL = '/api/token/'