from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from .serializers import (
    SignUpSerializer, EmailVerificationSerializer, LoginSerializer, 
    LakawonClassSerializer, LakawonDeductionSerializer,
    IncomeSerializer, ExpenseSerializer, DebtSerializer, LoanSerializer, SavingsSerializer,
    TaskSerializer, YearlyPlanSerializer, MonthlyPlanSerializer
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
from .models import LakawonClass, LakawonDeduction, Income, Expense, Debt, Loan, Savings, Task, YearlyPlan, MonthlyPlan
from datetime import datetime, date, timedelta
from django.utils import timezone
from django.db import IntegrityError
from decimal import Decimal

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
def lakawon_classes(request):
    """Get all Lakawon classes for the user"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
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
def lakawon_class_create(request):
    """Create a new Lakawon class"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
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
def lakawon_class_update(request, class_id):
    """Update a Lakawon class"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        class_obj = LakawonClass.objects.get(id=class_id, user=user)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
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
def lakawon_class_delete(request, class_id):
    """Delete a Lakawon class and associated deduction if cancelled"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        class_obj = LakawonClass.objects.get(id=class_id, user=user)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
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
def lakawon_salary_summary(request):
    """Get salary summary for the two payment periods"""
    user_id = request.GET.get('user_id')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
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
def lakawon_deductions(request):
    """Get all Lakawon deductions for the user"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
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
def lakawon_deduction_create(request):
    """Create a new Lakawon deduction"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = LakawonDeductionSerializer(data=request.data)
    if serializer.is_valid():
        deduction = serializer.save(user=user)
        return Response(LakawonDeductionSerializer(deduction).data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
def lakawon_deduction_update(request, deduction_id):
    """Update a Lakawon deduction"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        deduction = LakawonDeduction.objects.get(id=deduction_id, user=user)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
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
def lakawon_deduction_delete(request, deduction_id):
    """Delete a Lakawon deduction and associated cancelled class"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        deduction = LakawonDeduction.objects.get(id=deduction_id, user=user)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
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
def lakawon_class_cancel(request, class_id):
    """Cancel a Lakawon class - marks it as cancelled and creates a deduction"""
    user_id = request.data.get('user_id')
    student_name = request.data.get('student_name')
    reason = request.data.get('reason', 'Class cancelled')
    
    if not user_id:
        return Response({
            'error': 'User ID is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not student_name:
        return Response({
            'error': 'Student name is required.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        class_obj = LakawonClass.objects.get(id=class_id, user=user)
    except User.DoesNotExist:
        return Response({
            'error': 'User not found.'
        }, status=status.HTTP_404_NOT_FOUND)
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
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    incomes = Income.objects.filter(user=user)
    serializer = IncomeSerializer(incomes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_income_create(request):
    """Create a new income"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Ensure currency is USD
    data = request.data.copy()
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
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        income = Income.objects.get(id=income_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Income.DoesNotExist:
        return Response({'error': 'Income not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Ensure currency is USD
    data = request.data.copy()
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
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        income = Income.objects.get(id=income_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Income.DoesNotExist:
        return Response({'error': 'Income not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    income.delete()
    return Response({'message': 'Income deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_expenses(request):
    """Get all expenses for the user"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    expenses = Expense.objects.filter(user=user)
    serializer = ExpenseSerializer(expenses, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_expense_create(request):
    """Create a new expense"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Ensure currency is USD
    data = request.data.copy()
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
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        expense = Expense.objects.get(id=expense_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Expense.DoesNotExist:
        return Response({'error': 'Expense not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Ensure currency is USD
    data = request.data.copy()
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
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        expense = Expense.objects.get(id=expense_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Expense.DoesNotExist:
        return Response({'error': 'Expense not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    expense.delete()
    return Response({'message': 'Expense deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_debts(request):
    """Get all debts for the user"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    debts = Debt.objects.filter(user=user)
    serializer = DebtSerializer(debts, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_debt_create(request):
    """Create a new debt"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Ensure currency is USD
    data = request.data.copy()
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
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        debt = Debt.objects.get(id=debt_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
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
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        debt = Debt.objects.get(id=debt_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Debt.DoesNotExist:
        return Response({'error': 'Debt not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    debt.delete()
    return Response({'message': 'Debt deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_loans(request):
    """Get all loans for the user"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    loans = Loan.objects.filter(user=user)
    serializer = LoanSerializer(loans, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def salary_loan_create(request):
    """Create a new loan"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Ensure currency is USD
    data = request.data.copy()
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
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        loan = Loan.objects.get(id=loan_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
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
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        loan = Loan.objects.get(id=loan_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Loan.DoesNotExist:
        return Response({'error': 'Loan not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    loan.delete()
    return Response({'message': 'Loan deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_savings(request):
    """Get savings for the user"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        savings, created = Savings.objects.get_or_create(user=user, defaults={'amount': 0.00})
        serializer = SavingsSerializer(savings)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def salary_savings_update(request):
    """Update savings for the user"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        savings, created = Savings.objects.get_or_create(user=user, defaults={'amount': 0.00})
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    partial = request.method == 'PATCH'
    serializer = SavingsSerializer(savings, data=request.data, partial=partial)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def salary_summary(request):
    """Get financial summary with all calculations done in backend - all amounts in USD"""
    user_id = request.GET.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
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
    user_id = request.GET.get('user_id')
    task_date = request.GET.get('date')  # Format: YYYY-MM-DD
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
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
    
    if task_date or not task_date:  # Always filter by date when getting tasks
        tasks = tasks.filter(date=target_date)
    
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def productivity_task_create(request):
    """Create a new task"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
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
    serializer = TaskSerializer(data=request.data)
    if serializer.is_valid():
        task = serializer.save(user=user, is_template=False)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def productivity_task_update(request, task_id):
    """Update a task"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        task = Task.objects.get(id=task_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
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
    serializer = TaskSerializer(task, data=request.data, partial=partial)
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
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        task = Task.objects.get(id=task_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
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
    user_id = request.GET.get('user_id')
    year = request.GET.get('year')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
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
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = YearlyPlanSerializer(data=request.data)
    if serializer.is_valid():
        plan = serializer.save(user=user)
        return Response(YearlyPlanSerializer(plan).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def productivity_yearly_plan_delete(request, plan_id):
    """Delete a yearly plan"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        plan = YearlyPlan.objects.get(id=plan_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except YearlyPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    plan.delete()
    return Response({'message': 'Yearly plan deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productivity_monthly_plans(request):
    """Get all monthly plans for the user"""
    user_id = request.GET.get('user_id')
    year = request.GET.get('year')
    month = request.GET.get('month')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
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
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = MonthlyPlanSerializer(data=request.data)
    if serializer.is_valid():
        plan = serializer.save(user=user)
        return Response(MonthlyPlanSerializer(plan).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def productivity_monthly_plan_delete(request, plan_id):
    """Delete a monthly plan"""
    user_id = request.GET.get('user_id') or request.data.get('user_id')
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
        plan = MonthlyPlan.objects.get(id=plan_id, user=user)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    except MonthlyPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    plan.delete()
    return Response({'message': 'Monthly plan deleted successfully.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productivity_stats(request):
    """Get productivity statistics - weekly and monthly trends"""
    user_id = request.GET.get('user_id')
    start_date = request.GET.get('start_date')  # For weekly stats
    year = request.GET.get('year')  # For monthly stats
    month = request.GET.get('month')  # For monthly stats
    
    if not user_id:
        return Response({'error': 'User ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
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
