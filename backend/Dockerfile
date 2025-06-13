# MomoNail/backend/Dockerfile
# Pythonベースイメージ
FROM python:3.9-slim-buster

# 環境変数を設定
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV DJANGO_SETTINGS_MODULE momonail_backend_project.settings

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係をインストール
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのコードをコピー
COPY . /app/

EXPOSE 8080

ENV DJANGO_SECRET_KEY 'temporary-secret-key-for-building'
# collectstatic を実行 (Renderで静的ファイルはNginxやGCSで配信することが推奨されるが、
# Django自体が提供する場合はここで収集)
# RenderではNginxなどをフロントに置くのが一般的ではないため、Djangoが配信するか、GCSなどに別途配置する。
# ここでは、Djangoが静的ファイルを扱う前提で収集。
RUN python manage.py collectstatic --noinput
