from django.urls import path
from . import views
urlpatterns = [
    path('', views.check_logs_in_DB),
]
