from django.urls import path
from . import views

urlpatterns = [
    path('', views.LogListCreateView.as_view(), name='log-list-create'),
    path('bulk/', views.LogBulkCreateView.as_view(), name='log-bulk-create'),
    path('search/', views.LogSearchView.as_view(), name='log-search'),
    path('services/', views.LogServicesView.as_view(), name='log-services'),
    path('health/', views.health_check, name='health-check'),
    path('<str:log_id>/', views.LogDetailView.as_view(), name='log-detail'),
]