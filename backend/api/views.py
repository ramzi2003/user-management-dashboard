from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from .serializers import (
    SignUpSerializer, EmailVerificationSerializer, LoginSerializer, 
    LakawonClassSerializer, LakawonDeductionSerializer,
    IncomeSerializer, ExpenseSerializer, DebtSerializer, LoanSerializer, SavingsSerializer,
    TaskSerializer, YearlyPlanSerializer, MonthlyPlanSerializer,
    NutritionProfileSerializer, NutritionGoalSerializer, DailyMacroTargetSerializer,
    FoodItemSerializer, FoodLogEntrySerializer, WeightCheckInSerializer
)
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
import random
import string
from django.core.cache import cache
import requests
import json
from .models import (
    LakawonClass, LakawonDeduction, Income, Expense, Debt, Loan, Savings,
    Task, YearlyPlan, MonthlyPlan,
    NutritionProfile, NutritionGoal, DailyMacroTarget,
    FoodItem, FoodLogEntry, WeightCheckIn
)
from datetime import datetime, date, timedelta
from django.utils import timezone
from django.db import IntegrityError
from decimal import Decimal

# Security helper:
# - All authenticated endpoints must use request.user (from TokenAuthentication)
# - If the client sends user_id anyway, we only accept it when it matches request.user.id
def _authed_user_or_error(request):
    user = getattr(request, 'user', None)
    incoming_user_id = (
        getattr(request, 'query_params', {}).get('user_id')
        or request.GET.get('user_id')
        or request.data.get('user_id')
    )
    if incoming_user_id:
        try:
            if int(incoming_user_id) != user.id:
                return None, Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return None, Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)
    return user, None


# ----------------------------
# Nutrition helpers + endpoints
# ----------------------------

NUTRITION_ALGORITHM_VERSION = 'mifflin_v1'

def _calc_age_years(profile):
    if profile.birth_date:
        today = timezone.localdate()
        years = today.year - profile.birth_date.year
        before_bday = (today.month, today.day) < (profile.birth_date.month, profile.birth_date.day)
        return years - (1 if before_bday else 0)
    if profile.age_years is not None:
        return int(profile.age_years)
    return None


def _activity_multiplier(profile):
    if profile.activity_level == 'custom' and profile.activity_multiplier is not None:
        return float(profile.activity_multiplier)
    mapping = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'athlete': 1.9,
    }
    return mapping.get(profile.activity_level, 1.55)


def _default_goal_adjustment(goal_type):
    # Defaults can be overridden by user in goal settings
    return {
        'fat_loss': -20,
        'maintenance': 0,
        'recomp': -10,
        'lean_bulk': 10,
        'bulk': 15,
    }.get(goal_type, 0)


def _default_protein_per_kg(goal_type):
    return {
        'fat_loss': 2.2,
        'maintenance': 1.8,
        'recomp': 2.0,
        'lean_bulk': 1.8,
        'bulk': 1.6,
    }.get(goal_type, 1.8)


def _calculate_targets(profile, goal):
    # Mifflin-St Jeor (metric)
    age = _calc_age_years(profile)
    if age is None or age < 10 or age > 120:
        raise ValueError('Invalid age. Provide birth_date or age_years.')

    weight = float(profile.weight_kg)
    height = float(profile.height_cm)
    if weight <= 0 or height <= 0:
        raise ValueError('Invalid height/weight.')

    sex = profile.sex
    sex_const = 5 if sex == 'male' else -161

    bmr = (10 * weight) + (6.25 * height) - (5 * age) + sex_const
    mult = _activity_multiplier(profile)
    tdee = bmr * mult

    adj = float(goal.calorie_adjustment_percent)
    if abs(adj) < 0.0001:
        # If user didn't set anything meaningful, apply goal default
        adj = float(_default_goal_adjustment(goal.goal_type))

    calories = tdee * (1.0 + (adj / 100.0))

    # Basic safety floor
    floor = 1500 if sex == 'male' else 1200
    calories = max(calories, floor)

    # Macros
    protein_per_kg = float(goal.protein_g_per_kg) if goal.protein_g_per_kg else _default_protein_per_kg(goal.goal_type)
    fat_per_kg = float(goal.fat_g_per_kg) if goal.fat_g_per_kg else 0.8

    protein_g = max(0, round(protein_per_kg * weight))
    fat_g = max(0, round(fat_per_kg * weight))

    remaining = calories - (protein_g * 4) - (fat_g * 9)
    carbs_g = max(0, round(remaining / 4))

    # If macros exceed calories, reduce carbs first (already 0), then reduce fat to minimum 0.3g/kg
    if carbs_g == 0 and remaining < 0:
        min_fat = round(0.3 * weight)
        fat_g = max(min_fat, fat_g + round(remaining / 9))  # remaining is negative
        remaining2 = calories - (protein_g * 4) - (fat_g * 9)
        carbs_g = max(0, round(remaining2 / 4))

    return {
        'bmr': int(round(bmr)),
        'tdee': int(round(tdee)),
        'calories': int(round(calories)),
        'protein_g': int(protein_g),
        'carbs_g': int(carbs_g),
        'fat_g': int(fat_g),
        'activity_multiplier': float(mult),
        'calorie_adjustment_percent': float(adj),
        'algorithm_version': NUTRITION_ALGORITHM_VERSION,
    }


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def nutrition_profile(request):
    """Get or update nutrition profile for the authenticated user."""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    profile, _ = NutritionProfile.objects.get_or_create(
        user=user,
        defaults={
            'sex': 'male',
            'age_years': 25,
            'height_cm': Decimal('175.0'),
            'weight_kg': Decimal('75.0'),
            'activity_level': 'moderate',
        },
    )

    if request.method == 'GET':
        return Response(NutritionProfileSerializer(profile).data, status=status.HTTP_200_OK)

    partial = request.method == 'PATCH'
    data = request.data.copy()
    data.pop('user_id', None)
    serializer = NutritionProfileSerializer(profile, data=data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def nutrition_goal(request):
    """Get or update nutrition goal for the authenticated user."""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    goal, _ = NutritionGoal.objects.get_or_create(
        user=user,
        defaults={
            'goal_type': 'maintenance',
            'calorie_adjustment_percent': Decimal('0'),
            'protein_g_per_kg': Decimal('1.80'),
            'fat_g_per_kg': Decimal('0.80'),
        },
    )

    if request.method == 'GET':
        return Response(NutritionGoalSerializer(goal).data, status=status.HTTP_200_OK)

    partial = request.method == 'PATCH'
    data = request.data.copy()
    data.pop('user_id', None)
    serializer = NutritionGoalSerializer(goal, data=data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def nutrition_targets(request):
    """Compute (and store) today's macro targets from saved profile + goal."""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    target_date_str = request.GET.get('date')
    if target_date_str:
        try:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        target_date = timezone.localdate()

    try:
        profile = NutritionProfile.objects.get(user=user)
        goal = NutritionGoal.objects.get(user=user)
    except NutritionProfile.DoesNotExist:
        return Response({'error': 'Nutrition profile not set.'}, status=status.HTTP_400_BAD_REQUEST)
    except NutritionGoal.DoesNotExist:
        return Response({'error': 'Nutrition goal not set.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        calc = _calculate_targets(profile, goal)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Upsert snapshot for the day
    obj, _ = DailyMacroTarget.objects.update_or_create(
        user=user,
        date=target_date,
        defaults={
            'calories': calc['calories'],
            'protein_g': calc['protein_g'],
            'carbs_g': calc['carbs_g'],
            'fat_g': calc['fat_g'],
            'bmr': calc['bmr'],
            'tdee': calc['tdee'],
            'algorithm_version': calc['algorithm_version'],
        },
    )

    return Response({
        'date': target_date.isoformat(),
        'profile': NutritionProfileSerializer(profile).data,
        'goal': NutritionGoalSerializer(goal).data,
        'targets': DailyMacroTargetSerializer(obj).data,
        'calculation': {
            'activity_multiplier': calc['activity_multiplier'],
            'calorie_adjustment_percent': calc['calorie_adjustment_percent'],
        },
    }, status=status.HTTP_200_OK)


def _parse_date_or_today(request, key='date'):
    dstr = request.GET.get(key) or request.data.get(key)
    if dstr:
        try:
            return datetime.strptime(dstr, '%Y-%m-%d').date(), None
        except ValueError:
            return None, Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
    return timezone.localdate(), None


def _calc_day_totals(entries):
    # Keep calories as integer-ish, macros as 1dp floats
    total_cals = Decimal('0')
    total_p = Decimal('0')
    total_c = Decimal('0')
    total_f = Decimal('0')
    for e in entries:
        s = Decimal(str(e.servings))
        total_cals += Decimal(str(e.food.calories_kcal)) * s
        total_p += Decimal(str(e.food.protein_g)) * s
        total_c += Decimal(str(e.food.carbs_g)) * s
        total_f += Decimal(str(e.food.fat_g)) * s
    return {
        'calories': int(round(float(total_cals))),
        'protein_g': float(total_p.quantize(Decimal('0.1'))),
        'carbs_g': float(total_c.quantize(Decimal('0.1'))),
        'fat_g': float(total_f.quantize(Decimal('0.1'))),
    }


def _auto_adjust_from_checkins(goal_type, checkins, current_pct):
    """
    Heuristic auto-adjust:
    - Uses last ~14+ days (requires >=2 points).
    - fat_loss/recomp: if not losing, decrease calories by -5% (more deficit).
      if losing too fast, increase by +3%.
    - lean_bulk/bulk: if not gaining, increase by +5%.
      if gaining too fast, decrease by -3%.
    - maintenance: small nudges when drifting fast.
    """
    if len(checkins) < 2:
        return None

    # Use oldest->newest
    ordered = sorted(checkins, key=lambda x: x.date)
    start = ordered[0]
    end = ordered[-1]
    days = max(1, (end.date - start.date).days)
    delta_kg = float(end.weight_kg) - float(start.weight_kg)  # + = gain
    weekly_rate_kg = delta_kg / (days / 7.0)

    # guard: if period too short, it's too noisy
    if days < 10:
        return None

    # thresholds (kg/week)
    # Fat loss: want negative; Bulk: want positive
    if goal_type in ['fat_loss', 'recomp']:
        if weekly_rate_kg > -0.05:  # basically not losing
            return {'delta_pct': -5, 'reason': 'Progress stalled (not losing).', 'weekly_rate_kg': weekly_rate_kg, 'days': days, 'delta_kg': delta_kg}
        if weekly_rate_kg < -0.9:  # losing too fast
            return {'delta_pct': +3, 'reason': 'Losing too fast; easing deficit.', 'weekly_rate_kg': weekly_rate_kg, 'days': days, 'delta_kg': delta_kg}
        return {'delta_pct': 0, 'reason': 'On track.', 'weekly_rate_kg': weekly_rate_kg, 'days': days, 'delta_kg': delta_kg}

    if goal_type in ['lean_bulk', 'bulk']:
        if weekly_rate_kg < 0.05:  # basically not gaining
            return {'delta_pct': +5, 'reason': 'Progress stalled (not gaining).', 'weekly_rate_kg': weekly_rate_kg, 'days': days, 'delta_kg': delta_kg}
        if weekly_rate_kg > 0.7:  # gaining too fast
            return {'delta_pct': -3, 'reason': 'Gaining too fast; easing surplus.', 'weekly_rate_kg': weekly_rate_kg, 'days': days, 'delta_kg': delta_kg}
        return {'delta_pct': 0, 'reason': 'On track.', 'weekly_rate_kg': weekly_rate_kg, 'days': days, 'delta_kg': delta_kg}

    # maintenance
    if abs(weekly_rate_kg) > 0.5:
        return {'delta_pct': (-3 if weekly_rate_kg > 0 else +3), 'reason': 'Weight drifting; nudging calories.', 'weekly_rate_kg': weekly_rate_kg, 'days': days, 'delta_kg': delta_kg}
    return {'delta_pct': 0, 'reason': 'Stable.', 'weekly_rate_kg': weekly_rate_kg, 'days': days, 'delta_kg': delta_kg}


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def nutrition_checkins(request):
    """List/create weight check-ins for the authenticated user."""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    if request.method == 'GET':
        limit = request.GET.get('limit')
        qs = WeightCheckIn.objects.filter(user=user).order_by('-date')
        if limit:
            try:
                qs = qs[: max(1, min(100, int(limit)))]
            except ValueError:
                pass
        return Response(WeightCheckInSerializer(qs, many=True).data, status=status.HTTP_200_OK)

    data = request.data.copy()
    data.pop('user_id', None)
    serializer = WeightCheckInSerializer(data=data)
    if serializer.is_valid():
        # One per day: upsert
        obj, _ = WeightCheckIn.objects.update_or_create(
            user=user,
            date=serializer.validated_data['date'],
            defaults={'weight_kg': serializer.validated_data['weight_kg']},
        )
        return Response(WeightCheckInSerializer(obj).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def nutrition_checkin_delete(request, checkin_id):
    user, err = _authed_user_or_error(request)
    if err:
        return err
    try:
        obj = WeightCheckIn.objects.get(id=checkin_id, user=user)
    except WeightCheckIn.DoesNotExist:
        return Response({'error': 'Check-in not found.'}, status=status.HTTP_404_NOT_FOUND)
    obj.delete()
    return Response({'message': 'Check-in deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def nutrition_auto_adjust(request):
    """
    Compute (and optionally apply) an updated calorie_adjustment_percent based on weight check-ins.
    Body: { apply: true|false }
    """
    user, err = _authed_user_or_error(request)
    if err:
        return err

    apply = bool(request.data.get('apply', True))
    # last ~21 days worth of points (up to 8)
    since = timezone.localdate() - timedelta(days=21)
    checkins = list(WeightCheckIn.objects.filter(user=user, date__gte=since).order_by('date'))
    if len(checkins) < 2:
        return Response({'error': 'Need at least 2 check-ins in the last 21 days.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        profile = NutritionProfile.objects.get(user=user)
        goal = NutritionGoal.objects.get(user=user)
    except NutritionProfile.DoesNotExist:
        return Response({'error': 'Nutrition profile not set.'}, status=status.HTTP_400_BAD_REQUEST)
    except NutritionGoal.DoesNotExist:
        return Response({'error': 'Nutrition goal not set.'}, status=status.HTTP_400_BAD_REQUEST)

    current_pct = float(goal.calorie_adjustment_percent)
    rec = _auto_adjust_from_checkins(goal.goal_type, checkins, current_pct)
    if rec is None:
        return Response({'error': 'Not enough data (need >=10 days span).'}, status=status.HTTP_400_BAD_REQUEST)

    delta_pct = float(rec['delta_pct'])
    proposed = max(-40.0, min(40.0, current_pct + delta_pct))

    result = {
        'current_calorie_adjustment_percent': current_pct,
        'recommended_delta_percent': delta_pct,
        'recommended_calorie_adjustment_percent': proposed,
        'reason': rec['reason'],
        'trend': {
            'days': rec['days'],
            'delta_kg': rec['delta_kg'],
            'weekly_rate_kg': rec['weekly_rate_kg'],
            'from': checkins[0].date.isoformat(),
            'to': checkins[-1].date.isoformat(),
        },
        'applied': False,
    }

    if apply and delta_pct != 0:
        goal.calorie_adjustment_percent = Decimal(str(proposed))
        goal.save(update_fields=['calorie_adjustment_percent', 'updated_at'])
        result['applied'] = True

    # Return updated targets for today after (potential) adjustment
    try:
        calc = _calculate_targets(profile, goal)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    target_date = timezone.localdate()
    obj, _ = DailyMacroTarget.objects.update_or_create(
        user=user,
        date=target_date,
        defaults={
            'calories': calc['calories'],
            'protein_g': calc['protein_g'],
            'carbs_g': calc['carbs_g'],
            'fat_g': calc['fat_g'],
            'bmr': calc['bmr'],
            'tdee': calc['tdee'],
            'algorithm_version': calc['algorithm_version'],
        },
    )

    result['goal'] = NutritionGoalSerializer(goal).data
    result['targets'] = DailyMacroTargetSerializer(obj).data
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def nutrition_foods(request):
    """List/create foods in the user's personal catalog."""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    if request.method == 'GET':
        foods = FoodItem.objects.filter(user=user).order_by('name')
        return Response(FoodItemSerializer(foods, many=True).data, status=status.HTTP_200_OK)

    data = request.data.copy()
    data.pop('user_id', None)
    serializer = FoodItemSerializer(data=data)
    if serializer.is_valid():
        obj = serializer.save(user=user)
        return Response(FoodItemSerializer(obj).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def nutrition_food_update(request, food_id):
    """Update/delete a food in the user's catalog."""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        food = FoodItem.objects.get(id=food_id, user=user)
    except FoodItem.DoesNotExist:
        return Response({'error': 'Food not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        food.delete()
        return Response({'message': 'Food deleted successfully.'}, status=status.HTTP_200_OK)

    data = request.data.copy()
    data.pop('user_id', None)
    serializer = FoodItemSerializer(food, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def nutrition_log(request):
    """Get/add today's (or requested date) food log entries."""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    log_date, derr = _parse_date_or_today(request, key='date')
    if derr:
        return derr

    if request.method == 'GET':
        entries = FoodLogEntry.objects.select_related('food').filter(user=user, date=log_date).order_by('-created_at')
        return Response({
            'date': log_date.isoformat(),
            'entries': FoodLogEntrySerializer(entries, many=True).data,
            'totals': _calc_day_totals(entries),
        }, status=status.HTTP_200_OK)

    # POST create entry
    data = request.data.copy()
    data.pop('user_id', None)
    data['date'] = log_date.isoformat()
    serializer = FoodLogEntrySerializer(data=data)
    if serializer.is_valid():
        food = serializer.validated_data['food']
        if food.user_id != user.id:
            return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        serializer.save(user=user)
        entries = FoodLogEntry.objects.select_related('food').filter(user=user, date=log_date).order_by('-created_at')
        return Response({
            'date': log_date.isoformat(),
            'entries': FoodLogEntrySerializer(entries, many=True).data,
            'totals': _calc_day_totals(entries),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def nutrition_log_delete(request, entry_id):
    """Delete a single log entry."""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        entry = FoodLogEntry.objects.get(id=entry_id, user=user)
    except FoodLogEntry.DoesNotExist:
        return Response({'error': 'Entry not found.'}, status=status.HTTP_404_NOT_FOUND)

    log_date = entry.date
    entry.delete()
    entries = FoodLogEntry.objects.select_related('food').filter(user=user, date=log_date).order_by('-created_at')
    return Response({
        'date': log_date.isoformat(),
        'entries': FoodLogEntrySerializer(entries, many=True).data,
        'totals': _calc_day_totals(entries),
    }, status=status.HTTP_200_OK)

# All amounts are stored and returned in USD
def convert_between_currencies(amount, from_currency, to_currency):
    """Convert amount from one currency to another - always returns USD amount"""
    # All amounts are stored in USD, so just return the amount
    return float(amount)

@api_view(['GET'])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'message': 'Django backend is running'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def api_info(request):
    """API information endpoint"""
    return Response({
        'name': 'Personal Dashboard API',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health/',
            'info': '/api/info/',
        }
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def signup(request):
    """User registration endpoint"""
    email = request.data.get('email', '').strip()
    
    # Check if user exists but not verified - resend code instead
    existing_user = User.objects.filter(email=email).first()
    if existing_user and not existing_user.is_active:
        # User exists but not verified - resend verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        cache.set(f'verification_code_{email}', verification_code, 600)
        
        # Send verification email
        try:
            send_mail(
                subject='Verify your Life Dashboard account',
                message=f'Your verification code is: {verification_code}\n\nThis code will expire in 10 minutes.',
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@lifedashboard.com',
                recipient_list=[email],
                fail_silently=False,
            )
            # In development mode (console backend), also print to console
            if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
                print(f"\n{'='*60}")
                print(f"VERIFICATION CODE (RESENT) for {email}: {verification_code}")
                print(f"{'='*60}\n")
        except Exception as e:
            # Print to console if email sending fails
            print(f"\n{'='*60}")
            print(f"VERIFICATION CODE (RESENT) for {email}: {verification_code}")
            print(f"Email sending error: {e}")
            print(f"{'='*60}\n")
        
        return Response({
            'message': 'Verification code resent. Please check your email.',
            'email': email
        }, status=status.HTTP_200_OK)
    
    # Proceed with normal signup
    serializer = SignUpSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        # Store code in cache (expires in 10 minutes)
        cache.set(f'verification_code_{user.email}', verification_code, 600)
        
        # Send verification email
        try:
            send_mail(
                subject='Verify your Life Dashboard account',
                message=f'Your verification code is: {verification_code}\n\nThis code will expire in 10 minutes.',
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@lifedashboard.com',
                recipient_list=[user.email],
                fail_silently=False,
            )
            # In development mode (console backend), also print to console
            if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
                print(f"\n{'='*60}")
                print(f"VERIFICATION CODE for {user.email}: {verification_code}")
                print(f"{'='*60}\n")
        except Exception as e:
            # Print to console if email sending fails
            print(f"\n{'='*60}")
            print(f"VERIFICATION CODE for {user.email}: {verification_code}")
            print(f"Email sending error: {e}")
            print(f"{'='*60}\n")
        
        return Response({
            'message': 'User created successfully. Please check your email for verification code.',
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login(request):
    """User login endpoint"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Find user by email
        try:
            user = User.objects.filter(email=email).latest('id')
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Authenticate user
        authenticated_user = authenticate(username=user.username, password=password)
        
        if authenticated_user is None:
            return Response({
                'error': 'Invalid email or password.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not authenticated_user.is_active:
            return Response({
                'error': 'Your account is not verified. Please verify your email first.'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get or create token for the user
        token, created = Token.objects.get_or_create(user=authenticated_user)
        
        # Return user info and token
        return Response({
            'message': 'Login successful',
            'token': token.key,
            'user': {
                'id': authenticated_user.id,
                'email': authenticated_user.email,
                'first_name': authenticated_user.first_name,
                'last_name': authenticated_user.last_name,
            }
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout(request):
    """User logout endpoint"""
    # For stateless authentication, logout is mainly client-side
    # This endpoint can be used for server-side session cleanup if needed
    # or for logging logout events
    
    # If using token-based auth, you could invalidate the token here
    # For now, we'll just return success
    
    return Response({
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def verify_email(request):
    """Email verification endpoint"""
    serializer = EmailVerificationSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        
        # Check if code exists in cache
        cached_code = cache.get(f'verification_code_{email}')
        
        if not cached_code:
            return Response({
                'error': 'Verification code expired or invalid.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if cached_code != code:
            return Response({
                'error': 'Invalid verification code.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Activate user (get the most recent user with this email if duplicates exist)
        try:
            user = User.objects.filter(email=email).latest('id')
            user.is_active = True
            user.save()
            
            # Delete verification code from cache
            cache.delete(f'verification_code_{email}')
            
            return Response({
                'message': 'Email verified successfully. You can now log in.',
                'user_id': user.id
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def resend_verification_code(request):
    """Resend verification code endpoint"""
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': 'Email is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get the most recent user with this email if duplicates exist
        user = User.objects.filter(email=email).latest('id')
        if user.is_active:
            return Response({
                'error': 'Email already verified.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate new verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        cache.set(f'verification_code_{email}', verification_code, 600)
        
        # Send verification email
        try:
            send_mail(
                subject='Verify your Life Dashboard account',
                message=f'Your verification code is: {verification_code}\n\nThis code will expire in 10 minutes.',
                from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@lifedashboard.com',
                recipient_list=[email],
                fail_silently=False,
            )
            # In development mode (console backend), also print to console
            if settings.EMAIL_BACKEND == 'django.core.mail.backends.console.EmailBackend':
                print(f"\n{'='*60}")
                print(f"VERIFICATION CODE (RESENT) for {email}: {verification_code}")
                print(f"{'='*60}\n")
        except Exception as e:
            # Print to console if email sending fails
            print(f"\n{'='*60}")
            print(f"VERIFICATION CODE (RESENT) for {email}: {verification_code}")
            print(f"Email sending error: {e}")
            print(f"{'='*60}\n")
        
        return Response({
            'message': 'Verification code resent successfully.'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def google_oauth(request):
    """Google OAuth authentication endpoint"""
    access_token = request.data.get('access_token')
    
    if not access_token:
        return Response({
            'error': 'Access token is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Verify the token with Google
        response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if response.status_code != 200:
            return Response({
                'error': 'Invalid access token.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user_data = response.json()
        email = user_data.get('email')
        first_name = user_data.get('given_name', '')
        last_name = user_data.get('family_name', '')
        google_id = user_data.get('id')
        picture = user_data.get('picture', '')
        
        if not email:
            return Response({
                'error': 'Email not provided by Google.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists (get the most recent user with this email if duplicates exist)
        try:
            user = User.objects.filter(email=email).latest('id')
            # Update user info if needed
            if not user.first_name:
                user.first_name = first_name
            if not user.last_name:
                user.last_name = last_name
            user.is_active = True  # Google users are automatically verified
            user.save()
        except User.DoesNotExist:
            # Create new user
            username = email.split('@')[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True,  # Google users don't need email verification
            )
        
        # Get or create token for the user
        token, created = Token.objects.get_or_create(user=user)
        
        # Return user info with token
        return Response({
            'message': 'Authentication successful',
            'token': token.key,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'username': user.username,
            },
            'google_id': google_id,
            'picture': picture,
        }, status=status.HTTP_200_OK)
        
    except requests.RequestException as e:
        return Response({
            'error': 'Failed to verify token with Google.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            'error': 'An error occurred during authentication.',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Lakawon API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lakawon_classes(request):
    """Get all Lakawon classes for the user"""
    user = request.user
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get optional filter parameters
    month = request.GET.get('month')  # Format: YYYY-MM
    year = request.GET.get('year')    # Format: YYYY
    
    classes = LakawonClass.objects.filter(user=user)
    
    if month:
        try:
            year_val, month_val = map(int, month.split('-'))
            classes = classes.filter(date__year=year_val, date__month=month_val)
        except (ValueError, AttributeError):
            return Response({
                'error': 'Invalid month format. Use YYYY-MM.'
            }, status=status.HTTP_400_BAD_REQUEST)
    elif year:
        try:
            year_val = int(year)
            classes = classes.filter(date__year=year_val)
        except ValueError:
            return Response({
                'error': 'Invalid year format. Use YYYY.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = LakawonClassSerializer(classes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lakawon_class_create(request):
    """Create a new Lakawon class"""
    user = request.user
    user_id = request.data.get('user_id')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create serializer with user
    serializer = LakawonClassSerializer(data=request.data)
    if serializer.is_valid():
        try:
            # Save with user
            class_obj = serializer.save(user=user)
            return Response(LakawonClassSerializer(class_obj).data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response({
                'error': 'A class already exists at this date and time.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def lakawon_class_update(request, class_id):
    """Update a Lakawon class"""
    user = request.user
    user_id = request.data.get('user_id')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        class_obj = LakawonClass.objects.get(id=class_id, user=user)
    except LakawonClass.DoesNotExist:
        return Response({
            'error': 'Class not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    partial = request.method == 'PATCH'
    serializer = LakawonClassSerializer(class_obj, data=request.data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def lakawon_class_delete(request, class_id):
    """Delete a Lakawon class and associated deduction if cancelled"""
    user = request.user
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        class_obj = LakawonClass.objects.get(id=class_id, user=user)
    except LakawonClass.DoesNotExist:
        return Response({
            'error': 'Class not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # If the class is cancelled, delete the associated deduction
    if class_obj.cancelled:
        try:
            deduction = LakawonDeduction.objects.get(
                user=user,
                date=class_obj.date,
                time=class_obj.time
            )
            deduction.delete()
        except LakawonDeduction.DoesNotExist:
            # Deduction might not exist, which is okay
            pass
        except LakawonDeduction.MultipleObjectsReturned:
            # If multiple deductions exist for the same date/time, delete all of them
            LakawonDeduction.objects.filter(
                user=user,
                date=class_obj.date,
                time=class_obj.time
            ).delete()
    
    class_obj.delete()
    return Response({
        'message': 'Class deleted successfully.'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lakawon_salary_summary(request):
    """Get salary summary for the two payment periods"""
    user = request.user
    user_id = request.GET.get('user_id')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get optional year and month parameters
    year = request.GET.get('year')
    month = request.GET.get('month')
    
    if year:
        try:
            year_val = int(year)
        except ValueError:
            return Response({
                'error': 'Invalid year format. Use YYYY.'
            }, status=status.HTTP_400_BAD_REQUEST)
    else:
        year_val = timezone.now().year
    
    if month:
        try:
            month_val = int(month)
        except ValueError:
            return Response({
                'error': 'Invalid month format. Use 1-12.'
            }, status=status.HTTP_400_BAD_REQUEST)
    else:
        month_val = timezone.now().month
    
    # Get current date to determine periods
    today = timezone.now().date()
    
    # Period 1: 1st to 15th (paid on 18th)
    period1_start = date(year_val, month_val, 1)
    period1_end = date(year_val, month_val, 15)
    
    # Period 2: 16th to end of month (paid on 3rd of next month)
    period2_start = date(year_val, month_val, 16)
    # Calculate last day of month
    if month_val == 12:
        period2_end = date(year_val + 1, 1, 1) - timedelta(days=1)
    else:
        period2_end = date(year_val, month_val + 1, 1) - timedelta(days=1)
    
    # Get classes for period 1 (exclude cancelled classes)
    period1_classes = LakawonClass.objects.filter(
        user=user,
        date__gte=period1_start,
        date__lte=period1_end,
        cancelled=False
    )
    
    # Get classes for period 2 (exclude cancelled classes)
    period2_classes = LakawonClass.objects.filter(
        user=user,
        date__gte=period2_start,
        date__lte=period2_end,
        cancelled=False
    )
    
    # Get deductions for period 1
    period1_deductions = LakawonDeduction.objects.filter(
        user=user,
        date__gte=period1_start,
        date__lte=period1_end
    )
    period1_deduction_total = sum(deduction.amount for deduction in period1_deductions)
    period1_deduction_count = period1_deductions.count()
    
    # Get deductions for period 2
    period2_deductions = LakawonDeduction.objects.filter(
        user=user,
        date__gte=period2_start,
        date__lte=period2_end
    )
    period2_deduction_total = sum(deduction.amount for deduction in period2_deductions)
    period2_deduction_count = period2_deductions.count()
    
    # Calculate totals for period 1
    period1_class_total = sum(class_obj.amount for class_obj in period1_classes)
    period1_regular = sum(class_obj.amount for class_obj in period1_classes if class_obj.class_type == 'regular')
    period1_demo = sum(class_obj.amount for class_obj in period1_classes if class_obj.class_type == 'demo')
    period1_regular_count = period1_classes.filter(class_type='regular').count()
    period1_demo_count = period1_classes.filter(class_type='demo').count()
    # Subtract deductions from total
    period1_total = period1_class_total - period1_deduction_total
    
    # Calculate totals for period 2
    period2_class_total = sum(class_obj.amount for class_obj in period2_classes)
    period2_regular = sum(class_obj.amount for class_obj in period2_classes if class_obj.class_type == 'regular')
    period2_demo = sum(class_obj.amount for class_obj in period2_classes if class_obj.class_type == 'demo')
    period2_regular_count = period2_classes.filter(class_type='regular').count()
    period2_demo_count = period2_classes.filter(class_type='demo').count()
    # Subtract deductions from total
    period2_total = period2_class_total - period2_deduction_total
    
    # Payment dates
    period1_payment_date = date(year_val, month_val, 18)
    if month_val == 12:
        period2_payment_date = date(year_val + 1, 1, 3)
    else:
        period2_payment_date = date(year_val, month_val + 1, 3)
    
    return Response({
        'period1': {
            'start_date': period1_start.isoformat(),
            'end_date': period1_end.isoformat(),
            'payment_date': period1_payment_date.isoformat(),
            'total': float(period1_total),
            'regular_total': float(period1_regular),
            'demo_total': float(period1_demo),
            'regular_count': period1_regular_count,
            'demo_count': period1_demo_count,
            'total_count': period1_regular_count + period1_demo_count,
            'deduction_total': float(period1_deduction_total),
            'deduction_count': period1_deduction_count,
        },
        'period2': {
            'start_date': period2_start.isoformat(),
            'end_date': period2_end.isoformat(),
            'payment_date': period2_payment_date.isoformat(),
            'total': float(period2_total),
            'regular_total': float(period2_regular),
            'demo_total': float(period2_demo),
            'regular_count': period2_regular_count,
            'demo_count': period2_demo_count,
            'total_count': period2_regular_count + period2_demo_count,
            'deduction_total': float(period2_deduction_total),
            'deduction_count': period2_deduction_count,
        },
        'year': year_val,
        'month': month_val,
    }, status=status.HTTP_200_OK)


# Deduction API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lakawon_deductions(request):
    """Get all Lakawon deductions for the user"""
    user = request.user
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get optional filter parameters
    month = request.GET.get('month')  # Format: YYYY-MM
    year = request.GET.get('year')    # Format: YYYY
    
    deductions = LakawonDeduction.objects.filter(user=user)
    
    if month:
        try:
            year_val, month_val = map(int, month.split('-'))
            deductions = deductions.filter(date__year=year_val, date__month=month_val)
        except (ValueError, AttributeError):
            return Response({
                'error': 'Invalid month format. Use YYYY-MM.'
            }, status=status.HTTP_400_BAD_REQUEST)
    elif year:
        try:
            year_val = int(year)
            deductions = deductions.filter(date__year=year_val)
        except ValueError:
            return Response({
                'error': 'Invalid year format. Use YYYY.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = LakawonDeductionSerializer(deductions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lakawon_deduction_create(request):
    """Create a new Lakawon deduction"""
    user = request.user
    user_id = request.data.get('user_id')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = LakawonDeductionSerializer(data=request.data)
    if serializer.is_valid():
        deduction = serializer.save(user=user)
        return Response(LakawonDeductionSerializer(deduction).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def lakawon_deduction_update(request, deduction_id):
    """Update a Lakawon deduction"""
    user = request.user
    user_id = request.data.get('user_id')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        deduction = LakawonDeduction.objects.get(id=deduction_id, user=user)
    except LakawonDeduction.DoesNotExist:
        return Response({
            'error': 'Deduction not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    partial = request.method == 'PATCH'
    serializer = LakawonDeductionSerializer(deduction, data=request.data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def lakawon_deduction_delete(request, deduction_id):
    """Delete a Lakawon deduction and associated cancelled class"""
    user = request.user
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        deduction = LakawonDeduction.objects.get(id=deduction_id, user=user)
    except LakawonDeduction.DoesNotExist:
        return Response({
            'error': 'Deduction not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Find and delete the associated cancelled class
    try:
        cancelled_class = LakawonClass.objects.get(
            user=user,
            date=deduction.date,
            time=deduction.time,
            cancelled=True
        )
        cancelled_class.delete()
    except LakawonClass.DoesNotExist:
        # No associated cancelled class found, which is okay
        pass
    except LakawonClass.MultipleObjectsReturned:
        # If multiple cancelled classes exist for the same date/time, delete all of them
        LakawonClass.objects.filter(
            user=user,
            date=deduction.date,
            time=deduction.time,
            cancelled=True
        ).delete()
    
    # Delete the deduction
    deduction.delete()
    return Response({
        'message': 'Deduction and associated class deleted successfully.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lakawon_class_cancel(request, class_id):
    """Cancel a Lakawon class - marks it as cancelled and creates a deduction"""
    user = request.user
    user_id = request.data.get('user_id')
    student_name = request.data.get('student_name')
    reason = request.data.get('reason', 'Class cancelled')
    if user_id:
        try:
            if int(user_id) != user.id:
                return Response({'error': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid user_id.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not student_name:
        return Response({
            'error': 'Student name is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        class_obj = LakawonClass.objects.get(id=class_id, user=user)
    except LakawonClass.DoesNotExist:
        return Response({
            'error': 'Class not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Mark class as cancelled
    class_obj.cancelled = True
    class_obj.save()
    
    # Create deduction
    deduction = LakawonDeduction.objects.create(
        user=user,
        date=class_obj.date,
        time=class_obj.time,
        student_name=student_name,
        reason=reason,
        amount=5.00  # Default $5 deduction
    )
    
    return Response({
        'message': 'Class cancelled and deduction created successfully.',
        'class': LakawonClassSerializer(class_obj).data,
        'deduction': LakawonDeductionSerializer(deduction).data
    }, status=status.HTTP_200_OK)


# Salary & Income API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_incomes(request):
    """Get all incomes for the user"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    incomes = Income.objects.filter(user=user)
    serializer = IncomeSerializer(incomes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_income_create(request):
    """Create a new income"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    # Ensure currency is USD
    data = request.data.copy()
    data.pop('user_id', None)
    data['currency'] = 'USD'
    
    serializer = IncomeSerializer(data=data)
    if serializer.is_valid():
        income = serializer.save(user=user)
        return Response(IncomeSerializer(income).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def salary_income_update(request, income_id):
    """Update an income"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        income = Income.objects.get(id=income_id, user=user)
    except Income.DoesNotExist:
        return Response({'error': 'Income not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Ensure currency is USD
    data = request.data.copy()
    data.pop('user_id', None)
    if 'currency' in data:
        data['currency'] = 'USD'
    
    partial = request.method == 'PATCH'
    serializer = IncomeSerializer(income, data=data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def salary_income_delete(request, income_id):
    """Delete an income"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        income = Income.objects.get(id=income_id, user=user)
    except Income.DoesNotExist:
        return Response({'error': 'Income not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    income.delete()
    return Response({'message': 'Income deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_expenses(request):
    """Get all expenses for the user"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    expenses = Expense.objects.filter(user=user)
    serializer = ExpenseSerializer(expenses, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_expense_create(request):
    """Create a new expense"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    # Ensure currency is USD
    data = request.data.copy()
    data.pop('user_id', None)
    data['currency'] = 'USD'
    
    serializer = ExpenseSerializer(data=data)
    if serializer.is_valid():
        expense = serializer.save(user=user)
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def salary_expense_update(request, expense_id):
    """Update an expense"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        expense = Expense.objects.get(id=expense_id, user=user)
    except Expense.DoesNotExist:
        return Response({'error': 'Expense not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Ensure currency is USD
    data = request.data.copy()
    data.pop('user_id', None)
    if 'currency' in data:
        data['currency'] = 'USD'
    
    partial = request.method == 'PATCH'
    serializer = ExpenseSerializer(expense, data=data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def salary_expense_delete(request, expense_id):
    """Delete an expense"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        expense = Expense.objects.get(id=expense_id, user=user)
    except Expense.DoesNotExist:
        return Response({'error': 'Expense not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    expense.delete()
    return Response({'message': 'Expense deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_debts(request):
    """Get all debts for the user"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    debts = Debt.objects.filter(user=user)
    serializer = DebtSerializer(debts, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_debt_create(request):
    """Create a new debt"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    # Ensure currency is USD
    data = request.data.copy()
    data.pop('user_id', None)
    data['currency'] = 'USD'
    
    serializer = DebtSerializer(data=data)
    if serializer.is_valid():
        debt = serializer.save(user=user)
        return Response(DebtSerializer(debt).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def salary_debt_update(request, debt_id):
    """Update a debt"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        debt = Debt.objects.get(id=debt_id, user=user)
    except Debt.DoesNotExist:
        return Response({'error': 'Debt not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    partial = request.method == 'PATCH'
    # Remove user_id from data before passing to serializer (it's not a model field)
    data = request.data.copy()
    data.pop('user_id', None)
    # Ensure currency is USD
    if 'currency' in data:
        data['currency'] = 'USD'
    serializer = DebtSerializer(debt, data=data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def salary_debt_delete(request, debt_id):
    """Delete a debt"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        debt = Debt.objects.get(id=debt_id, user=user)
    except Debt.DoesNotExist:
        return Response({'error': 'Debt not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    debt.delete()
    return Response({'message': 'Debt deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_loans(request):
    """Get all loans for the user"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    loans = Loan.objects.filter(user=user)
    serializer = LoanSerializer(loans, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_loan_create(request):
    """Create a new loan"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    # Ensure currency is USD
    data = request.data.copy()
    data.pop('user_id', None)
    data['currency'] = 'USD'
    
    serializer = LoanSerializer(data=data)
    if serializer.is_valid():
        loan = serializer.save(user=user)
        return Response(LoanSerializer(loan).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def salary_loan_update(request, loan_id):
    """Update a loan"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        loan = Loan.objects.get(id=loan_id, user=user)
    except Loan.DoesNotExist:
        return Response({'error': 'Loan not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    partial = request.method == 'PATCH'
    # Remove user_id from data before passing to serializer (it's not a model field)
    data = request.data.copy()
    data.pop('user_id', None)
    # Ensure currency is USD
    if 'currency' in data:
        data['currency'] = 'USD'
    serializer = LoanSerializer(loan, data=data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def salary_loan_delete(request, loan_id):
    """Delete a loan"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        loan = Loan.objects.get(id=loan_id, user=user)
    except Loan.DoesNotExist:
        return Response({'error': 'Loan not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    loan.delete()
    return Response({'message': 'Loan deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_savings(request):
    """Get savings for the user"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    savings, created = Savings.objects.get_or_create(user=user, defaults={'amount': 0.00})
    serializer = SavingsSerializer(savings)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def salary_savings_update(request):
    """Update savings for the user"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    savings, created = Savings.objects.get_or_create(user=user, defaults={'amount': 0.00})
    
    partial = request.method == 'PATCH'
    data = request.data.copy()
    data.pop('user_id', None)
    serializer = SavingsSerializer(savings, data=data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_summary(request):
    """Get financial summary with all calculations done in backend - all amounts in USD"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    # Get current month and year
    now = timezone.now()
    current_month = now.month
    current_year = now.year
    
    # Get all data
    incomes = Income.objects.filter(user=user)
    expenses = Expense.objects.filter(user=user)
    debts = Debt.objects.filter(user=user)
    loans = Loan.objects.filter(user=user)
    savings_obj, _ = Savings.objects.get_or_create(user=user, defaults={'amount': 0.00})
    
    # Helper function to check if date is in current month
    def is_current_month(d):
        return d.month == current_month and d.year == current_year
    
    # Helper function to check if returned in current month
    def is_returned_in_current_month(item):
        if not item.returned or not item.returnedDate:
            return False
        return item.returnedDate.month == current_month and item.returnedDate.year == current_year
    
    # Calculate monthly income (current month) - all amounts in USD
    monthly_income = Decimal('0')
    for income in incomes:
        if is_current_month(income.date):
            monthly_income += Decimal(str(income.amount))
    
    # Calculate YTD income - all amounts in USD
    ytd_income = Decimal('0')
    for income in incomes:
        if income.date.year == current_year:
            ytd_income += Decimal(str(income.amount))
    
    # Calculate total expenses (excluding "Returned debts" for netSavings calculation)
    total_expenses = Decimal('0')
    returned_debts_expense = Decimal('0')
    for expense in expenses:
        if is_current_month(expense.date):
            if expense.description == 'Returned debts':
                returned_debts_expense += Decimal(str(expense.amount))
            else:
                total_expenses += Decimal(str(expense.amount))
    
    # Add savings (stored in USD)
    savings_amount = Decimal(str(savings_obj.amount))
    total_expenses += savings_amount
    
    # Total expenses for display (including returned debts)
    total_expenses_display = float(total_expenses) + float(returned_debts_expense)
    
    # Calculate total debts (non-returned) for display
    all_debts = Decimal('0')
    for debt in debts:
        if not debt.returned:
            all_debts += Decimal(str(debt.amount))
    
    # Calculate total loans (non-returned) for display
    all_loans = Decimal('0')
    for loan in loans:
        if not loan.returned:
            all_loans += Decimal(str(loan.amount))
    
    # Calculate available money (netSavings)
    # Debts from current month that are NOT returned: ADD (you have this money)
    non_returned_debts = Decimal('0')
    for debt in debts:
        if is_current_month(debt.date) and not debt.returned:
            non_returned_debts += Decimal(str(debt.amount))
    
    # Loans from current month that are NOT returned: SUBTRACT (you don't have this money)
    non_returned_loans = Decimal('0')
    for loan in loans:
        if is_current_month(loan.date) and not loan.returned:
            non_returned_loans += Decimal(str(loan.amount))
    
    # Loans returned in current month: ADD (you got the money back)
    returned_loans = Decimal('0')
    for loan in loans:
        if is_returned_in_current_month(loan):
            # Only count loans from previous months
            if loan.date.month < current_month or loan.date.year < current_year:
                returned_loans += Decimal(str(loan.amount))
    
    # Available Money = Income - Expenses (including returned debts) + Debts (current month, not returned) - Loans (current month, not returned) + Loans (returned this month)
    net_savings = float(monthly_income) - total_expenses_display + float(non_returned_debts) - float(non_returned_loans) + float(returned_loans)
    
    return Response({
        'monthly_income': float(monthly_income),
        'ytd_income': float(ytd_income),
        'total_expenses': total_expenses_display,
        'savings': float(savings_amount),
        'available_money': net_savings,
        'total_debts': float(all_debts),
        'total_loans': float(all_loans)
    }, status=status.HTTP_200_OK)


# Productivity API Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productivity_tasks(request):
    """Get all tasks for the user with optional date filter"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    user_id = request.GET.get('user_id')
    task_date = request.GET.get('date')  # Format: YYYY-MM-DD
    # (user_id is optional now; token decides the user)
    
    today = timezone.now().date()
    target_date = today
    
    if task_date:
        try:
            target_date = datetime.strptime(task_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Automatically delete old one-time incomplete tasks (older than today)
    Task.objects.filter(user=user, date__lt=today, completed=False, recurrence='once').delete()
    
    # Delete very old completed tasks (older than 30 days) to keep database clean
    thirty_days_ago = today - timedelta(days=30)
    Task.objects.filter(user=user, date__lt=thirty_days_ago, recurrence='once').delete()
    
    # Create recurring tasks for target_date if they don't exist
    templates = Task.objects.filter(user=user, is_template=True)
    
    for template in templates:
        # Check if task already exists for target_date
        existing = Task.objects.filter(
            user=user,
            title=template.title,
            scheduled_time=template.scheduled_time,
            date=target_date,
            is_template=False
        ).exists()
        
        if not existing:
            # Check if we should create this task based on recurrence
            should_create = False
            
            if template.recurrence == 'daily':
                should_create = True
            elif template.recurrence == 'weekdays':
                # 0=Monday, 6=Sunday
                should_create = target_date.weekday() < 5
            
            if should_create:
                Task.objects.create(
                    user=user,
                    title=template.title,
                    scheduled_time=template.scheduled_time,
                    date=target_date,
                    priority=template.priority,
                    recurrence=template.recurrence,
                    is_template=False,
                    completed=False
                )
    
    # Get tasks for the target date (exclude templates)
    tasks = Task.objects.filter(user=user, is_template=False)
    
    # If a date is provided, return only that day's tasks.
    # If no date is provided, return tasks across all dates (still excluding templates).
    if task_date:
        tasks = tasks.filter(date=target_date)
    
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def productivity_task_create(request):
    """Create a new task"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    recurrence = request.data.get('recurrence', 'once')
    
    # If recurring task, create a template
    if recurrence != 'once':
        # Create template (for future recurring instances)
        Task.objects.create(
            user=user,
            title=request.data.get('title'),
            scheduled_time=request.data.get('scheduled_time'),
            date=timezone.now().date(),  # Template date (not really used)
            priority=request.data.get('priority', 'medium'),
            recurrence=recurrence,
            is_template=True,
            completed=False
        )
    
    # Create the actual task instance for today
    data = request.data.copy()
    data.pop('user_id', None)
    serializer = TaskSerializer(data=data)
    if serializer.is_valid():
        task = serializer.save(user=user, is_template=False)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def productivity_task_update(request, task_id):
    """Update a task"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        task = Task.objects.get(id=task_id, user=user)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    old_title = task.title
    old_time = task.scheduled_time
    old_recurrence = task.recurrence
    was_template = task.is_template

    # If marking as completed, set completed_at timestamp
    if request.data.get('completed') and not task.completed:
        task.completed_at = timezone.now()
    elif not request.data.get('completed') and task.completed:
        task.completed_at = None
    
    partial = request.method == 'PATCH'
    data = request.data.copy()
    data.pop('user_id', None)
    serializer = TaskSerializer(task, data=data, partial=partial)
    if serializer.is_valid():
        saved_task = serializer.save()

        # Keep recurring templates in sync when editing today's task
        # - If user edits a recurring instance, update the template so future days follow
        # - If user changes recurrence to 'once', stop recurrence by deleting template
        new_recurrence = request.data.get('recurrence', old_recurrence)

        if not was_template:
            if old_recurrence != 'once':
                template_qs = Task.objects.filter(
                    user=user,
                    is_template=True,
                    recurrence=old_recurrence,
                    title=old_title,
                    scheduled_time=old_time,
                )
                if new_recurrence == 'once':
                    template_qs.delete()
                else:
                    template_qs.update(
                        title=saved_task.title,
                        scheduled_time=saved_task.scheduled_time,
                        recurrence=new_recurrence,
                        priority=saved_task.priority,
                    )
            else:
                # Was one-time, now recurring -> create template if missing
                if new_recurrence != 'once':
                    exists = Task.objects.filter(
                        user=user,
                        is_template=True,
                        recurrence=new_recurrence,
                        title=saved_task.title,
                        scheduled_time=saved_task.scheduled_time,
                    ).exists()
                    if not exists:
                        Task.objects.create(
                            user=user,
                            title=saved_task.title,
                            scheduled_time=saved_task.scheduled_time,
                            date=timezone.now().date(),  # template date is not used
                            priority=saved_task.priority,
                            recurrence=new_recurrence,
                            is_template=True,
                            completed=False,
                        )

        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def productivity_task_delete(request, task_id):
    """Delete a task"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        task = Task.objects.get(id=task_id, user=user)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # If this is a recurring task instance, also delete its template to stop recurrence
    if task.recurrence != 'once' and not task.is_template:
        Task.objects.filter(
            user=user,
            title=task.title,
            scheduled_time=task.scheduled_time,
            is_template=True,
            recurrence=task.recurrence
        ).delete()
    
    task.delete()
    return Response({'message': 'Task deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productivity_yearly_plans(request):
    """Get all yearly plans for the user"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    user_id = request.GET.get('user_id')
    year = request.GET.get('year')
    # (user_id is optional now; token decides the user)
    
    plans = YearlyPlan.objects.filter(user=user)
    
    if year:
        try:
            plans = plans.filter(year=int(year))
        except ValueError:
            return Response({'error': 'Invalid year format.'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = YearlyPlanSerializer(plans, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def productivity_yearly_plan_create(request):
    """Create a new yearly plan"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    data = request.data.copy()
    data.pop('user_id', None)
    serializer = YearlyPlanSerializer(data=data)
    if serializer.is_valid():
        plan = serializer.save(user=user)
        return Response(YearlyPlanSerializer(plan).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def productivity_yearly_plan_delete(request, plan_id):
    """Delete a yearly plan"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        plan = YearlyPlan.objects.get(id=plan_id, user=user)
    except YearlyPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    plan.delete()
    return Response({'message': 'Yearly plan deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productivity_monthly_plans(request):
    """Get all monthly plans for the user"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    user_id = request.GET.get('user_id')
    year = request.GET.get('year')
    month = request.GET.get('month')
    # (user_id is optional now; token decides the user)
    
    plans = MonthlyPlan.objects.filter(user=user)
    
    if year:
        try:
            plans = plans.filter(year=int(year))
        except ValueError:
            return Response({'error': 'Invalid year format.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if month:
        try:
            plans = plans.filter(month=int(month))
        except ValueError:
            return Response({'error': 'Invalid month format.'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = MonthlyPlanSerializer(plans, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def productivity_monthly_plan_create(request):
    """Create a new monthly plan"""
    user, err = _authed_user_or_error(request)
    if err:
        return err
    
    data = request.data.copy()
    data.pop('user_id', None)
    serializer = MonthlyPlanSerializer(data=data)
    if serializer.is_valid():
        plan = serializer.save(user=user)
        return Response(MonthlyPlanSerializer(plan).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def productivity_monthly_plan_delete(request, plan_id):
    """Delete a monthly plan"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    try:
        plan = MonthlyPlan.objects.get(id=plan_id, user=user)
    except MonthlyPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    plan.delete()
    return Response({'message': 'Monthly plan deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productivity_stats(request):
    """Get productivity statistics - weekly and monthly trends"""
    user, err = _authed_user_or_error(request)
    if err:
        return err

    user_id = request.GET.get('user_id')
    start_date = request.GET.get('start_date')  # For weekly stats
    year = request.GET.get('year')  # For monthly stats
    month = request.GET.get('month')  # For monthly stats
    # (user_id is optional now; token decides the user)
    
    # Calculate weekly stats (last 7 days from start_date or today)
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        start = timezone.now().date() - timedelta(days=6)
    
    weekly_data = []
    weekly_dates = []
    for i in range(7):
        day = start + timedelta(days=i)
        tasks = Task.objects.filter(user=user, date=day)
        total = tasks.count()
        completed = tasks.filter(completed=True).count()
        percentage = round((completed / total * 100) if total > 0 else 0)
        weekly_data.append(percentage)
        weekly_dates.append(day.isoformat())
    
    # Calculate monthly stats
    # - If year is provided without month: return 12 months (Jan..Dec) for that year
    # - If year+month are provided: return 4 week buckets for that month (W1..W4)
    # - Else: return last 12 weeks (W1..W12)
    monthly_labels = []

    if year and not month:
        try:
            year_val = int(year)
        except ValueError:
            return Response({'error': 'Invalid year format.'}, status=status.HTTP_400_BAD_REQUEST)

        # Month abbreviations (English) to avoid locale surprises
        monthly_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_data = []

        import calendar
        for m in range(1, 13):
            month_start = date(year_val, m, 1)
            last_day = calendar.monthrange(year_val, m)[1]
            month_end = date(year_val, m, last_day)

            tasks = Task.objects.filter(user=user, date__gte=month_start, date__lte=month_end)
            total = tasks.count()
            completed = tasks.filter(completed=True).count()
            percentage = round((completed / total * 100) if total > 0 else 0)
            monthly_data.append(percentage)

    elif year and month:
        try:
            year_val = int(year)
            month_val = int(month)
        except ValueError:
            return Response({'error': 'Invalid year or month format.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate for each week of the month (simplified to 4 weeks)
        month_start = date(year_val, month_val, 1)
        monthly_data = []
        monthly_labels = ['W1', 'W2', 'W3', 'W4']
        
        for week in range(4):
            week_start = month_start + timedelta(weeks=week)
            week_end = week_start + timedelta(days=6)
            
            tasks = Task.objects.filter(user=user, date__gte=week_start, date__lte=week_end)
            total = tasks.count()
            completed = tasks.filter(completed=True).count()
            percentage = round((completed / total * 100) if total > 0 else 0)
            monthly_data.append(percentage)
    else:
        # Default: last 12 weeks
        monthly_data = []
        monthly_labels = [f'W{i}' for i in range(1, 13)]
        today = timezone.now().date()
        
        for week in range(12):
            week_start = today - timedelta(weeks=11 - week)
            week_end = week_start + timedelta(days=6)
            
            tasks = Task.objects.filter(user=user, date__gte=week_start, date__lte=week_end)
            total = tasks.count()
            completed = tasks.filter(completed=True).count()
            percentage = round((completed / total * 100) if total > 0 else 0)
            monthly_data.append(percentage)
    
    return Response({
        'weekly_data': weekly_data,
        'weekly_dates': weekly_dates,
        'monthly_data': monthly_data
        ,
        'monthly_labels': monthly_labels,
    }, status=status.HTTP_200_OK)
