# backend/momonail_backend_project/celery.py

import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'momonail_backend_project.settings')

app = Celery('momonail_backend_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()