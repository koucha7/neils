# Generated manually to fix UserProfile foreign key constraint

from django.db import migrations, models, connection
from django.conf import settings


def fix_foreign_key_constraint(apps, schema_editor):
    """外部キー制約を安全に修正する"""
    with connection.cursor() as cursor:
        # 既存の制約をチェック
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'reservations_userprofile' 
            AND constraint_name = 'reservations_userprofile_user_id_fk_reservations_user'
        """)
        
        if not cursor.fetchone():
            # 制約が存在しない場合のみ作成
            
            # 古い制約を削除（存在する場合）
            cursor.execute("""
                ALTER TABLE reservations_userprofile 
                DROP CONSTRAINT IF EXISTS reservations_userprofile_user_id_3a1ab2a3_fk_auth_user_id
            """)
            
            # 無効なレコードを削除
            cursor.execute("""
                DELETE FROM reservations_userprofile 
                WHERE user_id NOT IN (SELECT id FROM reservations_user)
            """)
            
            # 正しい外部キー制約を追加
            cursor.execute("""
                ALTER TABLE reservations_userprofile 
                ADD CONSTRAINT reservations_userprofile_user_id_fk_reservations_user 
                FOREIGN KEY (user_id) REFERENCES reservations_user(id) 
                ON DELETE CASCADE
            """)


def reverse_fix(apps, schema_editor):
    """逆操作"""
    with connection.cursor() as cursor:
        cursor.execute("""
            ALTER TABLE reservations_userprofile 
            DROP CONSTRAINT IF EXISTS reservations_userprofile_user_id_fk_reservations_user
        """)


class Migration(migrations.Migration):

    dependencies = [
        ('reservations', '0007_userprofile_full_name'),
    ]

    operations = [
        migrations.RunPython(
            fix_foreign_key_constraint,
            reverse_fix
        ),
    ]
