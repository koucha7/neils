from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from .models import Customer

class CustomerJWTAuthentication(JWTAuthentication):
    """
    顧客（LINEユーザー）向けのカスタム認証クラス。
    JWTのペイロードに含まれる 'line_user_id' を使って、Customerモデルで認証を行います。
    """

    def get_user(self, validated_token):
        """
        検証済みトークンからユーザーを取得します。
        このメソッドをオーバーライドして、'line_user_id'を探すように変更します。
        """
        try:
            # 1. トークンのペイロード（.payload）から 'line_user_id' を取得します。
            #    これがエラーを解決する最も重要な修正点です。
            line_user_id = validated_token.payload.get('line_user_id')

            if not line_user_id:
                # トークンにline_user_idが含まれていなかった場合、エラーを発生させます。
                raise InvalidToken('Token does not contain a line_user_id')

        except AttributeError:
            # validated_tokenに.payload属性がないなど、予期せぬ形式の場合
            raise InvalidToken('Invalid token structure')
        except KeyError:
            # このエラーは通常発生しませんが、念のため残します。
            raise InvalidToken('Token contained no recognizable user identification')

        try:
            # 2. 取得したline_user_idを使って、データベースから顧客を検索します。
            customer = Customer.objects.get(line_user_id=line_user_id)
        except Customer.DoesNotExist:
            # 該当する顧客が見つからなければ、認証失敗とします。
            raise AuthenticationFailed('Customer not found', code='customer_not_found')

        # 3. 認証された顧客オブジェクトを返します。
        return customer
