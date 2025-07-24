# custom_auth/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("signup", views.handleSignup, name="signup"),
    path("login", views.handleLogin, name="signup"),
]
