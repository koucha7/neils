# backend/jello_backend_project/celery.py

import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jello_backend_project.settings')

app = Celery('jello_backend_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()