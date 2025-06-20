# Generated by Django 4.2.22 on 2025-06-08 19:43

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='salon',
            name='business_days',
            field=models.CharField(default='火〜日曜日（月曜定休）', max_length=255),
        ),
        migrations.AddField(
            model_name='salon',
            name='business_hours',
            field=models.CharField(default='10:00 - 20:00', max_length=255),
        ),
        migrations.CreateModel(
            name='Schedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(unique=True, verbose_name='日付')),
                ('is_closed', models.BooleanField(default=False, verbose_name='休業日')),
                ('opening_time', models.TimeField(blank=True, null=True, verbose_name='開店時間')),
                ('closing_time', models.TimeField(blank=True, null=True, verbose_name='閉店時間')),
                ('salon', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='schedules', to='reservations.salon', verbose_name='サロン')),
            ],
            options={
                'verbose_name': 'スケジュール',
                'verbose_name_plural': 'スケジュール',
                'ordering': ['date'],
            },
        ),
    ]
