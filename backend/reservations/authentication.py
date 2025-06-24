from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from .models import Customer

class CustomerJWTAuthentication(JWTAuthentication):
    """
    JWTのペイロードに含まれる 'line_user_id' を使って、
    DjangoのUserモデルの代わりにCustomerモデルで認証を行うカスタムバックエンド。
    """
    def get_user(self, validated_token):
        try:
            # トークンからline_user_idを取得
            line_user_id = validated_token['line_user_id']
        except KeyError:
            raise InvalidToken('Token does not contain user identification')

        try:
            # line_user_idを使ってCustomerを検索
            customer = Customer.objects.get(line_user_id=line_user_id)
        except Customer.DoesNotExist:
            raise AuthenticationFailed('Customer not found', code='customer_not_found')

        return customer