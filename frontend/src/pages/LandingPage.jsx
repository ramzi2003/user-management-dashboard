import { useNavigate, Navigate } from 'react-router-dom';
import {
  DollarSign,
  Heart,
  Clock,
  Users,
  MapPin,
  Wrench,
  ArrowRight,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Moon,
  Sun
} from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';

function LandingPage() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // If authenticated (has token), redirect to dashboard
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token || user) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    {
      icon: <DollarSign className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />,
      title: "Finance Tracker",
      description: "Manage expenses, track budgets, and visualize your financial health with intuitive dashboards."
    },
    {
      icon: <Heart className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Health & Fitness",
      description: "Track calories, log workouts, monitor body metrics, and maintain your wellness journey."
    },
    {
      icon: <Clock className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />,
      title: "Productivity Tools",
      description: "Stay focused with Pomodoro timers, deadline countdowns, and time management features."
    },
    {
      icon: <Users className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />,
      title: "Social & Relationships",
      description: "Plan events, track gift ideas, and manage your contacts all in one organized space."
    },
    {
      icon: <MapPin className="w-8 h-8 text-amber-500 dark:text-amber-400" />,
      title: "Travel & Location",
      description: "Plan trips, create packing lists, and calculate travel costs with ease."
    },
    {
      icon: <Wrench className="w-8 h-8 text-amber-500 dark:text-amber-400" />,
      title: "Utilities & Converters",
      description: "Access unit converters, QR generators, text tools, and other daily utilities."
    }
  ];

  const benefits = [
    {
      icon: <BarChart3 className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />,
      title: "Beautiful Visualizations",
      description: "Transform your data into stunning charts and insights"
    },
    {
      icon: <Shield className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />,
      title: "Privacy-First",
      description: "Your data stays secure and under your control"
    },
    {
      icon: <Zap className="w-10 h-10 text-amber-500 dark:text-amber-400" />,
      title: "Lightning Fast",
      description: "Instant access to all your personal metrics"
    },
    {
      icon: <Globe className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />,
      title: "Access Anywhere",
      description: "Seamlessly sync across all your devices"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Hero Section */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xl font-semibold text-gray-900 dark:text-white">Life Dashboard</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">Features</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">About</a>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <button 
              onClick={() => navigate('/signin')}
              className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-5 py-2 bg-indigo-500 dark:bg-indigo-600 text-white rounded-lg hover:bg-indigo-600 dark:hover:bg-indigo-700 transition font-medium"
            >
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Your Personal Life Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            Organize every aspect of your life in one beautiful, intuitive platform.
            Track finances, health, productivity, and more with powerful tools designed
            for the modern individual.
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-indigo-500 dark:bg-indigo-600 text-white rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-700 transition font-semibold text-lg inline-flex items-center space-x-2 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-600/20"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 dark:from-indigo-900/20 to-transparent rounded-3xl -z-10"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need, All in One Place
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comprehensive tools to help you manage every aspect of your personal life with elegance and efficiency.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-800/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Preview Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-900/30 dark:to-emerald-900/30 rounded-3xl p-12 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              A Dashboard That Works For You
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Customize your view with widgets and tools that matter most to you
            </p>
          </div>

          {/* Dashboard Mockup */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Finance Widget */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Monthly Budget</h4>
                  <DollarSign className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Spending</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">$2,450</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-indigo-500 dark:bg-indigo-400 h-2 rounded-full" style={{width: '65%'}}></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">65% of $3,750 budget</div>
                </div>
              </div>

              {/* Health Widget */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Daily Activity</h4>
                  <Heart className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Steps</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">8,234</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-emerald-500 dark:bg-emerald-400 h-2 rounded-full" style={{width: '82%'}}></div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">82% of 10,000 goal</div>
                </div>
              </div>

              {/* Productivity Widget */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Project Deadline</h4>
                  <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <div className="text-center py-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">5</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">days remaining</div>
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Q4 Report Due</div>
                </div>
              </div>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Active Goals</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">94%</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Completion Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">3</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Upcoming Trips</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">47</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Days Streak</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-4 border border-gray-200 dark:border-gray-700">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-3xl p-16 text-center shadow-xl">
          <h2 className="text-4xl font-bold text-white mb-4">
            Start Managing Your Life Today
          </h2>
          <p className="text-xl text-indigo-100 dark:text-indigo-200 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have transformed the way they organize their personal lives.
          </p>
          <button 
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-white dark:bg-gray-100 text-indigo-600 dark:text-indigo-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white transition font-semibold text-lg inline-flex items-center space-x-2 shadow-lg"
          >
            <span>Create Your Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Life Dashboard</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your personal command center for life management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Account</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Login</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Sign Up</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 Life Dashboard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

