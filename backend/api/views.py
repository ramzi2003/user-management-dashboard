from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import SignUpSerializer, EmailVerificationSerializer
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
import random
import string
from django.core.cache import cache
import requests
import json

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
        
        # Activate user
        try:
            user = User.objects.get(email=email)
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
        user = User.objects.get(email=email)
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
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
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
        
        # Return user info (you can add JWT token generation here if needed)
        return Response({
            'message': 'Authentication successful',
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
