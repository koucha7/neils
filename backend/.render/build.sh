#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# データベースの構造変更を検知し、マイグレーションファイルを作成します
python manage.py makemigrations
# 作成されたマイグレーションファイルを元に、データベースに適用します
python manage.py migrate

# 3. Gunicornサーバーを起動します
#    この行が、このスクリプトの最後に実行される命令になります。
gunicorn jello_backend_project.wsgi:application --bind 0.0.0.0:$PORT
