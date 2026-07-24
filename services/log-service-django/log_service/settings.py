import environ
import os
from pathlib import Path

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment variables
env = environ.Env(
    DEBUG=(bool, False)
)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# Security
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# Applications
INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.staticfiles',
    'rest_framework',
    'logs',
]

# Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

# URL configuration
ROOT_URLCONF = 'log_service.urls'

# No SQL database needed — we use MongoDB directly
# Django requires a database config but we use a dummy one
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# MongoDB configuration (accessed via pymongo directly)
MONGODB_URI = env('MONGODB_URI')
MONGODB_NAME = env('MONGODB_NAME')

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
    'UNAUTHENTICATED_USER': None,
}

# Static files
STATIC_URL = '/static/'

# Default auto field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# RabbitMQ
RABBITMQ_HOST = env('RABBITMQ_HOST', default='localhost')
RABBITMQ_PORT = env.int('RABBITMQ_PORT', default=5672)
RABBITMQ_USER = env('RABBITMQ_USER', default='guest')
RABBITMQ_PASSWORD = env('RABBITMQ_PASSWORD', default='guest')