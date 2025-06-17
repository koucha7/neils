#!/usr/bin/env bash
# exit on error
set -o errexit

# PoetryやPipなどの依存関係をインストール
pip install -r requirements.txt

# 静的ファイルを集める
python manage.py collectstatic --no-input

# ★★★ データベースのマイグレーションをここに記述 ★★★
python manage.py migrate