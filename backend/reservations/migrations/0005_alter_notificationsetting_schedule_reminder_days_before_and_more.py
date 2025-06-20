# Generated by Django 4.2.22 on 2025-06-09 16:15

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0004_alter_notificationsetting_schedule_reminder_days_before_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notificationsetting',
            name='schedule_reminder_days_before',
            field=models.IntegerField(default=1, help_text='何日後までの予約状況をリマインドするか設定します（1〜7日）。', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(7)], verbose_name='リマインド日数（X日前に通知）'),
        ),
        migrations.AlterField(
            model_name='notificationsetting',
            name='schedule_reminder_enabled',
            field=models.BooleanField(default=False, verbose_name='【管理者向け】スケジュールリマインダーを有効にする'),
        ),
        migrations.AlterField(
            model_name='notificationsetting',
            name='unconfirmed_reminder_days_before',
            field=models.IntegerField(default=2, help_text='予約日の何日前に管理者にリマインドを送信するか設定します（1〜14日）。', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(14)], verbose_name='リマインド日数（X日前に通知）'),
        ),
        migrations.AlterField(
            model_name='notificationsetting',
            name='unconfirmed_reminder_enabled',
            field=models.BooleanField(default=True, verbose_name='【管理者向け】予約未確定リマインダーを有効にする'),
        ),
    ]
