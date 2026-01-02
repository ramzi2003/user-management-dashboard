from django.contrib import admin
from .models import LakawonClass, LakawonDeduction, Income, Expense, Debt, Loan, Savings

@admin.register(LakawonClass)
class LakawonClassAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'time', 'class_type', 'amount', 'cancelled']
    list_filter = ['class_type', 'date', 'cancelled']
    search_fields = ['user__email', 'user__username']
    ordering = ['-date', '-time']

@admin.register(LakawonDeduction)
class LakawonDeductionAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'time', 'student_name', 'amount']
    list_filter = ['date']
    search_fields = ['user__email', 'user__username', 'student_name']
    ordering = ['-date', '-time']

@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ['user', 'description', 'amount', 'currency', 'date']
    list_filter = ['currency', 'date']
    search_fields = ['user__email', 'user__username', 'description']
    ordering = ['-date', '-created_at']

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['user', 'description', 'amount', 'currency', 'date']
    list_filter = ['currency', 'date']
    search_fields = ['user__email', 'user__username', 'description']
    ordering = ['-date', '-created_at']

@admin.register(Debt)
class DebtAdmin(admin.ModelAdmin):
    list_display = ['user', 'person', 'amount', 'currency', 'date', 'returned']
    list_filter = ['currency', 'date', 'returned']
    search_fields = ['user__email', 'user__username', 'person']
    ordering = ['-date', '-created_at']

@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ['user', 'person', 'amount', 'currency', 'date', 'returned']
    list_filter = ['currency', 'date', 'returned']
    search_fields = ['user__email', 'user__username', 'person']
    ordering = ['-date', '-created_at']

@admin.register(Savings)
class SavingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'updated_at']
    search_fields = ['user__email', 'user__username']
    ordering = ['-updated_at']
