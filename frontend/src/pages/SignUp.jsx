import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  DollarSign,
  Heart,
  Clock,
  Users,
  MapPin,
  Wrench,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Mail
} from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import api from '../services/api';
import './SignUp.css';

function SignUp() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [step, setStep] = useState(1); // 1 = signup form, 2 = email verification
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/signup/', {
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password,
        confirm_password: confirmPassword,
      });

      if (response.status === 201) {
        toast.success('Account created! Please check your email for verification code.');
        // Move to verification step
        setStep(2);
      }
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(errorMessage);
        } else {
          toast.error(errorData);
        }
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load Google Identity Services
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/verify-email/', {
        email: email,
        code: verificationCode,
      });

      if (response.status === 200) {
        toast.success('Email verified successfully! Redirecting...');
        // Store user info if needed
        if (response.data.user_id) {
          localStorage.setItem('user', JSON.stringify({ id: response.data.user_id, email: email }));
        }
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const firstError = Object.values(errorData)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(errorMessage);
        } else {
          toast.error(errorData);
        }
      } else {
        toast.error('Invalid verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/resend-code/', {
        email: email,
      });
      toast.success('Verification code resent to your email.');
    } catch (err) {
      toast.error('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (!googleLoaded) {
      toast.warning('Google Sign-In is still loading. Please wait a moment.');
      return;
    }

    setIsLoading(true);

    if (window.google && window.google.accounts) {
      // Use Google OAuth 2.0 flow
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        scope: 'email profile',
        callback: async (tokenResponse) => {
          try {
            if (tokenResponse.error) {
              toast.error('Google authentication was cancelled or failed.');
              setIsLoading(false);
              return;
            }

            // Send access token to backend
            const backendResponse = await api.post('/api/auth/google/', {
              access_token: tokenResponse.access_token,
            });

            if (backendResponse.status === 200) {
              toast.success('Successfully signed in with Google!');
              // Store user info if needed
              if (backendResponse.data.user) {
                localStorage.setItem('user', JSON.stringify(backendResponse.data.user));
              }
              // Redirect to dashboard
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            }
          } catch (err) {
            if (err.response?.data) {
              const errorData = err.response.data;
              toast.error(errorData.error || 'Google authentication failed. Please try again.');
            } else {
              toast.error('An error occurred during Google authentication.');
            }
            setIsLoading(false);
          }
        },
      });
      client.requestAccessToken();
    } else {
      toast.error('Google Sign-In is not available. Please use manual sign up.');
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Finance Tracking",
      subtitle: "Budget & Expense Management"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Health Metrics",
      subtitle: "Fitness & Wellness Goals"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Productivity",
      subtitle: "Time Management Tools"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Social Hub",
      subtitle: "Events & Relationships"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Travel Plans",
      subtitle: "Trip Organization"
    },
    {
      icon: <Wrench className="w-6 h-6" />,
      title: "Utilities",
      subtitle: "Daily Tools & Converters"
    }
  ];

  return (
    <div className="signup-page">
      {/* Left Side - Visuals */}
      <div className="signup-left">
        {/* Back Button */}
        <Link to="/" className="back-button">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </Link>

        {/* Decorative Elements */}
        <div className="decorative-circle circle-1"></div>
        <div className="decorative-circle circle-2"></div>
        <div className="decorative-circle circle-3"></div>

        {/* Main Content */}
        <div className="signup-left-content">
          <div>
            <h2 className="signup-left-title">
              Your Life,<br />Organized
            </h2>
            <p className="signup-left-subtitle">
              Join thousands managing every aspect of their life in one beautiful place.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="feature-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
              >
                <div className="feature-card-content">
                  <div className={`feature-icon ${
                    index % 3 === 0 ? 'icon-indigo' :
                    index % 3 === 1 ? 'icon-emerald' :
                    'icon-amber'
                  }`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="feature-title">
                      {feature.title}
                    </h4>
                    <p className="feature-subtitle">
                      {feature.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-value">10k+</div>
              <p className="stat-label">Active Users</p>
            </div>
            <div className="stat-item">
              <div className="stat-value">4.9★</div>
              <p className="stat-label">User Rating</p>
            </div>
            <div className="stat-item">
              <div className="stat-value">100%</div>
              <p className="stat-label">Private Data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="signup-right">
        <div className="signup-form-container">
          {/* Back button for mobile */}
          <Link to="/" className="back-button-mobile">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>

          {/* Header */}
          <div className="signup-form-header">
            <h1 className="signup-form-title">
              Create Your Account
            </h1>
            <p className="signup-form-subtitle">
              Join us and start organizing your life today.
            </p>
          </div>

          {/* Step 1: Sign Up Form */}
          {step === 1 && (
          <form onSubmit={handleSubmit} className="signup-form">
            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="google-signup-btn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            {/* Name Fields */}
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                  className="form-input"
                />
              </div>
              <div className="form-field">
                <label className="form-label">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                  className="form-input"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="form-field">
              <label className="form-label">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="form-input"
              />
            </div>

            {/* Password Input */}
            <div className="form-field">
              <label className="form-label">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="form-field">
              <label className="form-label">
                Confirm Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter your password"
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="terms-container">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="terms-checkbox"
              />
              <label htmlFor="terms" className="terms-label">
                I agree to the{' '}
                <a href="#" className="terms-link">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="terms-link">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password || !confirmPassword || !agreedToTerms}
              className="submit-button"
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
          )}

          {/* Step 2: Email Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyEmail} className="signup-form">
              <div className="verification-header">
                <Mail className="w-12 h-12 text-indigo-500 dark:text-indigo-400 mb-4" />
                <h2 className="signup-form-title">
                  Verify Your Email
                </h2>
                <p className="signup-form-subtitle">
                  We've sent a verification code to
                </p>
                <p className="text-gray-900 dark:text-white font-semibold mb-4">
                  {email}
                </p>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                  }}
                  required
                  maxLength="6"
                  placeholder="000000"
                  className="verification-input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="submit-button"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="resend-button"
              >
                Resend Code
              </button>
            </form>
          )}

          {/* Sign In Link */}
          {step === 1 && (
            <p className="signin-link">
              Already have an account?{' '}
              <Link to="/signin" className="signin-link-text">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignUp;
