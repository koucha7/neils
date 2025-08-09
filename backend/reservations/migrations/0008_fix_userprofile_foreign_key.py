# Generated manually to fix UserProfile foreign key constraint

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0007_userprofile_full_name'),
    ]

    operations = [
        # まず既存の外部キー制約を削除
        migrations.RunSQL(
            """
            ALTER TABLE reservations_userprofile 
            DROP CONSTRAINT IF EXISTS reservations_userprofile_user_id_3a1ab2a3_fk_auth_user_id;
            """,
            reverse_sql="""
            -- 逆操作は手動で行う必要があります
            """
        ),
        
        # 無効なレコードを削除（reservations_userテーブルに存在しないuser_idを持つレコード）
        migrations.RunSQL(
            """
            DELETE FROM reservations_userprofile 
            WHERE user_id NOT IN (SELECT id FROM reservations_user);
            """,
            reverse_sql="""
            -- 削除されたレコードは復元できません
            """
        ),
        
        # 正しい外部キー制約を追加
        migrations.RunSQL(
            """
            ALTER TABLE reservations_userprofile 
            ADD CONSTRAINT reservations_userprofile_user_id_fk_reservations_user 
            FOREIGN KEY (user_id) REFERENCES reservations_user(id) 
            ON DELETE CASCADE;
            """,
            reverse_sql="""
            ALTER TABLE reservations_userprofile 
            DROP CONSTRAINT IF EXISTS reservations_userprofile_user_id_fk_reservations_user;
            """
        ),
    ]
