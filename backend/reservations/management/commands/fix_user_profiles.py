from django.core.management.base import BaseCommand
from django.db import connection, transaction
from reservations.models import User, UserProfile
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'データベースの整合性をチェックし、UserProfileの問題を修正します'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='実際の修正は行わず、問題の確認のみを行います',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('ドライランモード: 実際の修正は行いません'))
        
        self.stdout.write('データベース整合性チェックを開始します...')
        
        # 1. reservations_userテーブルの確認
        self.check_reservations_users()
        
        # 2. auth_userテーブルとの不整合チェック
        self.check_user_inconsistencies(dry_run)
        
        # 3. UserProfileの外部キー制約チェック
        self.check_userprofile_constraints(dry_run)
        
        self.stdout.write(self.style.SUCCESS('整合性チェック完了'))

    def check_reservations_users(self):
        """reservations_userテーブルのユーザー数を確認"""
        user_count = User.objects.count()
        self.stdout.write(f'reservations_userテーブルのユーザー数: {user_count}')
        
        if user_count > 0:
            self.stdout.write('存在するユーザー:')
            for user in User.objects.all()[:10]:  # 最初の10件のみ表示
                self.stdout.write(f'  ID: {user.id}, Username: {user.username}, Email: {user.email}')

    def check_user_inconsistencies(self, dry_run):
        """auth_userとreservations_userの不整合をチェック"""
        with connection.cursor() as cursor:
            # auth_userテーブルが存在するかチェック
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='auth_user';
            """)
            auth_user_exists = cursor.fetchone()
            
            if auth_user_exists:
                self.stdout.write('auth_userテーブルが存在します')
                
                # auth_userのレコード数を確認
                cursor.execute("SELECT COUNT(*) FROM auth_user;")
                auth_user_count = cursor.fetchone()[0]
                self.stdout.write(f'auth_userテーブルのレコード数: {auth_user_count}')
                
                if auth_user_count == 0:
                    self.stdout.write(self.style.WARNING('auth_userテーブルは空です'))
            else:
                self.stdout.write('auth_userテーブルは存在しません')

    def check_userprofile_constraints(self, dry_run):
        """UserProfileの外部キー制約をチェックし、修正"""
        self.stdout.write('UserProfileの外部キー制約をチェック中...')
        
        # 既存のUserProfileレコードを確認
        profiles = UserProfile.objects.all()
        self.stdout.write(f'現在のUserProfileレコード数: {profiles.count()}')
        
        problematic_profiles = []
        
        for profile in profiles:
            try:
                # UserProfileのuserフィールドが有効なreservations.Userオブジェクトを参照しているかチェック
                user = profile.user
                if not isinstance(user, User):
                    self.stdout.write(self.style.ERROR(f'ProfileID {profile.id}: 無効なユーザー参照'))
                    problematic_profiles.append(profile)
                elif not User.objects.filter(id=user.id).exists():
                    self.stdout.write(self.style.ERROR(f'ProfileID {profile.id}: ユーザーID {user.id} が存在しません'))
                    problematic_profiles.append(profile)
                else:
                    self.stdout.write(f'ProfileID {profile.id}: OK (UserID: {user.id})')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'ProfileID {profile.id}: エラー - {str(e)}'))
                problematic_profiles.append(profile)
        
        if problematic_profiles:
            self.stdout.write(self.style.WARNING(f'問題のあるUserProfileレコード: {len(problematic_profiles)}件'))
            
            if not dry_run:
                self.stdout.write('問題のあるUserProfileレコードを削除します...')
                with transaction.atomic():
                    for profile in problematic_profiles:
                        self.stdout.write(f'ProfileID {profile.id} を削除')
                        profile.delete()
                self.stdout.write(self.style.SUCCESS('問題のあるレコードを削除しました'))
            else:
                self.stdout.write('ドライランモードのため、削除は実行されません')
        else:
            self.stdout.write(self.style.SUCCESS('UserProfileの外部キー制約に問題はありません'))

    def create_missing_profiles(self, dry_run):
        """UserProfileが存在しないユーザーに対してプロファイルを作成"""
        users_without_profile = User.objects.filter(profile__isnull=True)
        
        if users_without_profile.exists():
            self.stdout.write(f'UserProfileが存在しないユーザー: {users_without_profile.count()}件')
            
            if not dry_run:
                self.stdout.write('不足しているUserProfileを作成します...')
                with transaction.atomic():
                    for user in users_without_profile:
                        UserProfile.objects.create(user=user)
                        self.stdout.write(f'UserID {user.id} ({user.username}) のProfileを作成')
                self.stdout.write(self.style.SUCCESS('不足しているUserProfileを作成しました'))
            else:
                self.stdout.write('ドライランモードのため、作成は実行されません')
        else:
            self.stdout.write('すべてのユーザーにUserProfileが存在します')
