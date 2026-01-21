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

from .models import (
    LakawonClass, LakawonDeduction, Income, Expense, Debt, Loan, Savings,
    Task, YearlyPlan, MonthlyPlan,
    NutritionProfile, NutritionGoal, DailyMacroTarget,
    FoodItem, FoodLogEntry, WeightCheckIn
)

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
        # Ensure currency is always USD
        if 'currency' in data:
            data['currency'] = 'USD'
        return data
    
    def create(self, validated_data):
        # Force currency to USD
        validated_data['currency'] = 'USD'
        return super().create(validated_data)


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
        # Ensure currency is always USD
        if 'currency' in data:
            data['currency'] = 'USD'
        return data
    
    def create(self, validated_data):
        # Force currency to USD
        validated_data['currency'] = 'USD'
        return super().create(validated_data)


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
        # Ensure currency is always USD
        if 'currency' in data:
            data['currency'] = 'USD'
        return data
    
    def create(self, validated_data):
        # Force currency to USD
        validated_data['currency'] = 'USD'
        return super().create(validated_data)


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
        # Ensure currency is always USD
        if 'currency' in data:
            data['currency'] = 'USD'
        return data
    
    def create(self, validated_data):
        # Force currency to USD
        validated_data['currency'] = 'USD'
        return super().create(validated_data)


class SavingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Savings
        fields = ['id', 'amount', 'updated_at']
        read_only_fields = ['updated_at']
    
    def validate(self, data):
        if 'amount' not in data or data['amount'] < 0:
            raise serializers.ValidationError({"amount": "Amount cannot be negative."})
        return data


# Productivity Serializers
class TaskSerializer(serializers.ModelSerializer):
    scheduled_time = serializers.TimeField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'scheduled_time', 'date', 'completed', 'priority', 'recurrence', 'is_template', 'created_at', 'updated_at', 'completed_at']
        read_only_fields = ['is_template', 'created_at', 'updated_at', 'completed_at']
    
    def validate(self, data):
        if 'title' in data and not data['title'].strip():
            raise serializers.ValidationError({"title": "Title cannot be empty."})
        if 'date' not in data and self.instance is None:
            raise serializers.ValidationError({"date": "Date is required."})
        return data


class YearlyPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = YearlyPlan
        fields = ['id', 'title', 'year', 'completed', 'order', 'created_at']
        read_only_fields = ['created_at']
    
    def validate(self, data):
        if 'title' in data and not data['title'].strip():
            raise serializers.ValidationError({"title": "Title cannot be empty."})
        if 'year' not in data and self.instance is None:
            raise serializers.ValidationError({"year": "Year is required."})
        return data


class MonthlyPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyPlan
        fields = ['id', 'title', 'year', 'month', 'completed', 'order', 'created_at']
        read_only_fields = ['created_at']
    
    def validate(self, data):
        if 'title' in data and not data['title'].strip():
            raise serializers.ValidationError({"title": "Title cannot be empty."})
        if 'year' not in data and self.instance is None:
            raise serializers.ValidationError({"year": "Year is required."})
        if 'month' not in data and self.instance is None:
            raise serializers.ValidationError({"month": "Month is required."})
        if 'month' in data and (data['month'] < 1 or data['month'] > 12):
            raise serializers.ValidationError({"month": "Month must be between 1 and 12."})
        return data


# Nutrition & Calories Serializers
class NutritionProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionProfile
        fields = [
            'id',
            'sex',
            'birth_date',
            'age_years',
            'height_cm',
            'weight_kg',
            'activity_level',
            'activity_multiplier',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        # Either birth_date or age_years must be present (for create),
        # and both can exist (birth_date wins in calculation).
        instance = getattr(self, 'instance', None)
        birth_date = data.get('birth_date', getattr(instance, 'birth_date', None))
        age_years = data.get('age_years', getattr(instance, 'age_years', None))
        if not birth_date and (age_years is None):
            raise serializers.ValidationError({'age_years': 'Provide birth_date or age_years.'})

        activity_level = data.get('activity_level', getattr(instance, 'activity_level', 'moderate'))
        activity_multiplier = data.get('activity_multiplier', getattr(instance, 'activity_multiplier', None))
        if activity_level == 'custom':
            if activity_multiplier is None:
                raise serializers.ValidationError({'activity_multiplier': 'Required when activity_level is custom.'})
            try:
                mult = float(activity_multiplier)
            except (TypeError, ValueError):
                raise serializers.ValidationError({'activity_multiplier': 'Invalid number.'})
            if mult < 1.1 or mult > 2.5:
                raise serializers.ValidationError({'activity_multiplier': 'Must be between 1.1 and 2.5.'})
        return data


class NutritionGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionGoal
        fields = [
            'id',
            'goal_type',
            'calorie_adjustment_percent',
            'protein_g_per_kg',
            'fat_g_per_kg',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        # Light safety checks
        if 'calorie_adjustment_percent' in data:
            try:
                pct = float(data['calorie_adjustment_percent'])
            except (TypeError, ValueError):
                raise serializers.ValidationError({'calorie_adjustment_percent': 'Invalid number.'})
            if pct < -40 or pct > 40:
                raise serializers.ValidationError({'calorie_adjustment_percent': 'Must be between -40 and 40.'})

        if 'protein_g_per_kg' in data:
            try:
                v = float(data['protein_g_per_kg'])
            except (TypeError, ValueError):
                raise serializers.ValidationError({'protein_g_per_kg': 'Invalid number.'})
            if v < 0.8 or v > 3.0:
                raise serializers.ValidationError({'protein_g_per_kg': 'Must be between 0.8 and 3.0.'})

        if 'fat_g_per_kg' in data:
            try:
                v = float(data['fat_g_per_kg'])
            except (TypeError, ValueError):
                raise serializers.ValidationError({'fat_g_per_kg': 'Invalid number.'})
            if v < 0.3 or v > 2.0:
                raise serializers.ValidationError({'fat_g_per_kg': 'Must be between 0.3 and 2.0.'})
        return data


class DailyMacroTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMacroTarget
        fields = [
            'id',
            'date',
            'calories',
            'protein_g',
            'carbs_g',
            'fat_g',
            'bmr',
            'tdee',
            'algorithm_version',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = [
            'id',
            'name',
            'calories_kcal',
            'protein_g',
            'carbs_g',
            'fat_g',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        if 'name' in data and not str(data['name']).strip():
            raise serializers.ValidationError({'name': 'Name is required.'})
        if 'calories_kcal' in data:
            try:
                cals = int(data['calories_kcal'])
            except (TypeError, ValueError):
                raise serializers.ValidationError({'calories_kcal': 'Invalid number.'})
            if cals <= 0 or cals > 10000:
                raise serializers.ValidationError({'calories_kcal': 'Must be between 1 and 10000.'})
        for f in ['protein_g', 'carbs_g', 'fat_g']:
            if f in data and data[f] is not None:
                try:
                    v = float(data[f])
                except (TypeError, ValueError):
                    raise serializers.ValidationError({f: 'Invalid number.'})
                if v < 0 or v > 500:
                    raise serializers.ValidationError({f: 'Must be between 0 and 500.'})
        return data


class FoodLogEntrySerializer(serializers.ModelSerializer):
    food = FoodItemSerializer(read_only=True)
    food_id = serializers.PrimaryKeyRelatedField(source='food', queryset=FoodItem.objects.all(), write_only=True)

    class Meta:
        model = FoodLogEntry
        fields = [
            'id',
            'date',
            'servings',
            'food',
            'food_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        if 'servings' in data and data['servings'] is not None:
            try:
                s = float(data['servings'])
            except (TypeError, ValueError):
                raise serializers.ValidationError({'servings': 'Invalid number.'})
            if s <= 0 or s > 100:
                raise serializers.ValidationError({'servings': 'Must be between 0.01 and 100.'})
        return data


class WeightCheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightCheckIn
        fields = [
            'id',
            'date',
            'weight_kg',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        if 'weight_kg' in data:
            try:
                w = float(data['weight_kg'])
            except (TypeError, ValueError):
                raise serializers.ValidationError({'weight_kg': 'Invalid number.'})
            if w < 20 or w > 300:
                raise serializers.ValidationError({'weight_kg': 'Must be between 20 and 300.'})
        return data
