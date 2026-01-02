from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('info/', views.api_info, name='api_info'),
    path('auth/signup/', views.signup, name='signup'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/verify-email/', views.verify_email, name='verify_email'),
    path('auth/resend-code/', views.resend_verification_code, name='resend_verification_code'),
    path('auth/google/', views.google_oauth, name='google_oauth'),
    # Lakawon endpoints
    path('lakawon/classes/', views.lakawon_classes, name='lakawon_classes'),
    path('lakawon/classes/create/', views.lakawon_class_create, name='lakawon_class_create'),
    path('lakawon/classes/<int:class_id>/', views.lakawon_class_update, name='lakawon_class_update'),
    path('lakawon/classes/<int:class_id>/delete/', views.lakawon_class_delete, name='lakawon_class_delete'),
    path('lakawon/classes/<int:class_id>/cancel/', views.lakawon_class_cancel, name='lakawon_class_cancel'),
    path('lakawon/salary-summary/', views.lakawon_salary_summary, name='lakawon_salary_summary'),
    # Deduction endpoints
    path('lakawon/deductions/', views.lakawon_deductions, name='lakawon_deductions'),
    path('lakawon/deductions/create/', views.lakawon_deduction_create, name='lakawon_deduction_create'),
    path('lakawon/deductions/<int:deduction_id>/', views.lakawon_deduction_update, name='lakawon_deduction_update'),
    path('lakawon/deductions/<int:deduction_id>/delete/', views.lakawon_deduction_delete, name='lakawon_deduction_delete'),
]

