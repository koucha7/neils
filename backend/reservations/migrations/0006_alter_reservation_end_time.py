# Generated by Django 4.2.22 on 2025-06-10 05:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0005_alter_notificationsetting_schedule_reminder_days_before_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reservation',
            name='end_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
