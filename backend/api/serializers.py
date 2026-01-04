from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
import re

class SignUpSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'password', 'confirm_password')
        extra_kwargs = {'username': {'required': False}}  # Username will be auto-generated from email

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if email already exists
        email = attrs['email']
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            if existing_user.is_active:
                raise serializers.ValidationError({"email": "An account with this email already exists. Please sign in instead."})
            # If user exists but not verified, we'll handle it in the view to resend code
        
        # Check password strength
        password = attrs['password']
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        if not re.search(r'[A-Z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one uppercase letter."})
        if not re.search(r'[a-z]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one lowercase letter."})
        if not re.search(r'[0-9]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one number."})
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise serializers.ValidationError({"password": "Password must contain at least one special character."})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        password = validated_data.pop('password')
        
        # Generate username from email (before @ symbol)
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        
        # Ensure username is unique
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=False  # User needs to verify email
        )
        return user

class EmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, max_length=6)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

from .models import LakawonClass, LakawonDeduction, Income, Expense, Debt, Loan, Savings

class LakawonClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = LakawonClass
        fields = ['id', 'date', 'time', 'class_type', 'amount', 'cancelled', 'created_at', 'updated_at']
        read_only_fields = ['amount', 'created_at', 'updated_at']
    
    def validate(self, data):
        # Ensure date and time are provided
        if 'date' not in data:
            raise serializers.ValidationError({"date": "Date is required."})
        if 'time' not in data:
            raise serializers.ValidationError({"time": "Time is required."})
        return data


class LakawonDeductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LakawonDeduction
        fields = ['id', 'date', 'time', 'student_name', 'reason', 'amount', 'created_at', 'updated_at']
        read_only_fields = ['amount', 'created_at', 'updated_at']
    
    def validate(self, data):
        if 'date' not in data:
            raise serializers.ValidationError({"date": "Date is required."})
        if 'time' not in data:
            raise serializers.ValidationError({"time": "Time is required."})
        if 'student_name' not in data:
            raise serializers.ValidationError({"student_name": "Student name is required."})
        if 'reason' not in data:
            raise serializers.ValidationError({"reason": "Reason is required."})
        return data


class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = ['id', 'description', 'amount', 'currency', 'date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        if 'description' not in data or not data['description']:
            raise serializers.ValidationError({"description": "Description is required."})
        if 'amount' not in data or data['amount'] <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than 0."})
        if 'date' not in data:
            raise serializers.ValidationError({"date": "Date is required."})
        return data


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'description', 'amount', 'currency', 'date', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        if 'description' not in data or not data['description']:
            raise serializers.ValidationError({"description": "Description is required."})
        if 'amount' not in data or data['amount'] <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than 0."})
        if 'date' not in data:
            raise serializers.ValidationError({"date": "Date is required."})
        return data


class DebtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Debt
        fields = ['id', 'person', 'description', 'amount', 'currency', 'date', 'returned', 'returnedDate', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        # Only validate fields that are being updated (for partial updates)
        if 'person' in data and (not data['person'] or data['person'].strip() == ''):
            raise serializers.ValidationError({"person": "Person is required."})
        if 'amount' in data and data['amount'] <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than 0."})
        if 'date' in data and not data['date']:
            raise serializers.ValidationError({"date": "Date is required."})
        return data


class LoanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = ['id', 'person', 'description', 'amount', 'currency', 'date', 'returned', 'returnedDate', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        # Only validate fields that are being updated (for partial updates)
        if 'person' in data and (not data['person'] or data['person'].strip() == ''):
            raise serializers.ValidationError({"person": "Person is required."})
        if 'amount' in data and data['amount'] <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than 0."})
        if 'date' in data and not data['date']:
            raise serializers.ValidationError({"date": "Date is required."})
        return data


class SavingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Savings
        fields = ['id', 'amount', 'updated_at']
        read_only_fields = ['updated_at']
    
    def validate(self, data):
        if 'amount' not in data or data['amount'] < 0:
            raise serializers.ValidationError({"amount": "Amount cannot be negative."})
        return data
