from django.http import HttpResponseForbidden
from django.http import HttpResponseForbidden
from functools import wraps

from django.http import HttpResponseForbidden
from functools import wraps

def role_required(*roles):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # Check if user is in any of the provided roles or is a superuser
            user_role=request.user.role
            if user_role  not in roles and not request.user.is_superuser:
                return HttpResponseForbidden("You do not have permission to access this page.")
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
