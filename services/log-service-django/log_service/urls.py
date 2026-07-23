from django.urls import path, include

urlpatterns = [
    path('api/logs/', include('logs.urls')),
]