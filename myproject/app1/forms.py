from django.contrib.auth.forms import UserCreationForm
from .models import User

class registerform(UserCreationForm):
    class Meta:
        model=User
        fields=fields = [ 'username', 'email', 'password1', 'password2']