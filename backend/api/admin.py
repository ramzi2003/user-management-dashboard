from django.contrib import admin
from .models import LakawonClass, LakawonDeduction

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
