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
    # Salary & Income endpoints
    path('salary/incomes/', views.salary_incomes, name='salary_incomes'),
    path('salary/incomes/create/', views.salary_income_create, name='salary_income_create'),
    path('salary/incomes/<int:income_id>/', views.salary_income_update, name='salary_income_update'),
    path('salary/incomes/<int:income_id>/delete/', views.salary_income_delete, name='salary_income_delete'),
    path('salary/expenses/', views.salary_expenses, name='salary_expenses'),
    path('salary/expenses/create/', views.salary_expense_create, name='salary_expense_create'),
    path('salary/expenses/<int:expense_id>/', views.salary_expense_update, name='salary_expense_update'),
    path('salary/expenses/<int:expense_id>/delete/', views.salary_expense_delete, name='salary_expense_delete'),
    path('salary/debts/', views.salary_debts, name='salary_debts'),
    path('salary/debts/create/', views.salary_debt_create, name='salary_debt_create'),
    path('salary/debts/<int:debt_id>/', views.salary_debt_update, name='salary_debt_update'),
    path('salary/debts/<int:debt_id>/delete/', views.salary_debt_delete, name='salary_debt_delete'),
    path('salary/loans/', views.salary_loans, name='salary_loans'),
    path('salary/loans/create/', views.salary_loan_create, name='salary_loan_create'),
    path('salary/loans/<int:loan_id>/', views.salary_loan_update, name='salary_loan_update'),
    path('salary/loans/<int:loan_id>/delete/', views.salary_loan_delete, name='salary_loan_delete'),
    path('salary/savings/', views.salary_savings, name='salary_savings'),
    path('salary/savings/update/', views.salary_savings_update, name='salary_savings_update'),
]

