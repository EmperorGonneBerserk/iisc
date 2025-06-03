"""
Django settings for myproject project.
"""

from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-9n7+jy8d_+8_=$p_@adafsk3!ktnk7*e4xr^ew@3qj)(9u&dhe'

DEBUG = True

ALLOWED_HOSTS = ["*"]

# ✅ Session-based Authentication (No JWT)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',

    ],
}

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'app1.apps.App1Config',
    'rest_framework',
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "templates"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'myproject.wsgi.application'

AUTH_USER_MODEL = 'app1.User'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR/'db.sqlite3',
    }
}

# ✅ Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ✅ Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ✅ Static & Media Files
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ✅ CSRF & CORS Fixes for React Native Web
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",  
    "http://127.0.0.1:8081",
]

# ✅ Django Sessions (for authentication)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
# SESSION_COOKIE_HTTPONLY = False
SESSION_COOKIE_AGE = 86400 
# CSRF_COOKIE_NAME = "csrftoken" # 1 day
# SESSION_COOKIE_SECURE = True  # Set True if using HTTPS
# SESSION_COOKIE_SAMESITE = "None"
# SESSION_SAVE_EVERY_REQUEST = True

CSRF_COOKIE_SECURE = True  # CSRF cookie must be secure
CSRF_COOKIE_HTTPONLY = False  # Allow JS to read CSRF cookie
CSRF_COOKIE_SAMESITE = "None"  # Allow cross-origin cookies

SESSION_COOKIE_SECURE = True  # Secure session cookie
SESSION_COOKIE_SAMESITE = "None"  # Allow cross-origin session cookie
SESSION_COOKIE_HTTPONLY = True