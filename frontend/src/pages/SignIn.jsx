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
  LogIn
} from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import api from '../services/api';
import './SignUp.css';

function SignIn() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!email.trim()) {
      toast.error('Email address is required');
      return;
    }
    if (!password) {
      toast.error('Password is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login/', {
        email: email.trim(),
        password: password,
      });

      if (response.status === 200) {
        toast.success('Login successful! Redirecting...');
        // Store user info
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
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
          toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
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

  const handleGoogleSignIn = () => {
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
      toast.error('Google Sign-In is not available. Please use manual sign in.');
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
              Welcome Back
            </h2>
            <p className="signup-left-subtitle">
              Sign in to continue managing your life in one beautiful place.
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
              Sign In to Your Account
            </h1>
            <p className="signup-form-subtitle">
              Welcome back! Please enter your details to continue.
            </p>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="signup-form">
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
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

            {/* Email Input */}
            <div className="form-field">
              <label className="form-label">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="form-input"
                required
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
                  placeholder="Enter your password"
                  className="form-input"
                  required
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

            {/* Forgot Password Link */}
            <div className="flex justify-end mb-2">
              <Link to="#" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="submit-button"
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="signin-link">
            Don't have an account?{' '}
            <Link to="/signup" className="signin-link-text">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;

