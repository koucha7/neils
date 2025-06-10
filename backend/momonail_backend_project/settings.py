# MomoNail/backend/momonail_backend_project/settings.py
import os
import dj_database_url # ★追加

from pathlib import Path

DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') # ★環境変数から読み込む (Renderで設定)

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',') # ★環境変数で設定 (Renderで設定)

BASE_DIR = Path(__file__).resolve().parent.parent

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

# Whitenoise を使用する場合
# MIDDLEWARE の適切な位置に 'whitenoise.middleware.WhiteNoiseMiddleware' を追加
# 例: MIDDLEWARE = ['django.middleware.security.SecurityMiddleware', 'whitenoise.middleware.WhiteNoiseMiddleware', ...]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage' # Whitenoise用