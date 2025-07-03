#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# ▼▼▼ この2行を追記 ▼▼▼
# データベースの構造変更を検知し、マイグレーションファイルを作成します
python manage.py makemigrations
# 作成されたマイグレーションファイルを元に、データベースに適用します
python manage.py migrate
# ▲▲▲ ここまで追記 ▲▲▲

# 静的ファイルを集めるコマンド（必要に応じて）
# python manage.py collectstatic --no-input