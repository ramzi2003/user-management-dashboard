from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('info/', views.api_info, name='api_info'),
    path('auth/signup/', views.signup, name='signup'),
    path('auth/verify-email/', views.verify_email, name='verify_email'),
    path('auth/resend-code/', views.resend_verification_code, name='resend_verification_code'),
    path('auth/google/', views.google_oauth, name='google_oauth'),
]

