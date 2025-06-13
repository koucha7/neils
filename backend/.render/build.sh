#!/usr/bin/env bash

# エラーが発生したらスクリプトを終了
set -o errexit

# Djangoの依存関係をインストール
pip install -r requirements.txt

# collectstatic の実行 (STATIC_ROOTに静的ファイルを収集)
python manage.py collectstatic --noinput

# データベースマイグレーションの実行
python manage.py migrate --noinput

python manage.py createsuperuser