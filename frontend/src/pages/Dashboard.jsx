import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  DollarSign,
  Heart,
  Clock,
  Users,
  MapPin,
  Wrench,
  BarChart3,
  LogOut,
  Home,
  TrendingUp,
  Book,
  Menu,
  X,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import SalarySection from '../components/SalarySection';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { currency, setCurrency, currencies, exchangeRates, updateExchangeRate } = useCurrency();
  
  // Load activeSection from localStorage on mount, default to 'home'
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('dashboard_activeSection') || 'home';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showCurrencySettings, setShowCurrencySettings] = useState(false);

  // Save activeSection to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboard_activeSection', activeSection);
  }, [activeSection]);

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = userInfo.email || 'user@example.com';
  const userName = userInfo.first_name || userInfo.email?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // If no user, redirect will be handled by ProtectedRoute, but we can add a check here too
  if (!localStorage.getItem('user')) {
    return null; // ProtectedRoute will handle redirect
  }

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint (optional, for server-side cleanup)
      try {
        await api.post('/api/auth/logout/');
      } catch (err) {
        // Ignore errors from backend logout - proceed with client-side cleanup
        console.log('Backend logout failed, proceeding with client-side logout');
      }
      
      // Clear all user-related data from localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Optionally clear salary data (uncomment if you want to clear on logout)
      // localStorage.removeItem('salary_incomes');
      // localStorage.removeItem('salary_expenses');
      // localStorage.removeItem('salary_debts');
      // localStorage.removeItem('salary_loans');
      // localStorage.removeItem('salary_savings');
      
      toast.success('Logged out successfully');
      
      // Small delay before redirect for better UX
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error) {
      // Even if there's an error, clear data and redirect
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  const utilitiesSubsections = [
    {
      id: 'lakawon',
      label: 'Lakawon',
      icon: <img src="/lakawon-icon.jpg" alt="Lakawon" className="w-5 h-5 rounded-full object-cover" />
    }
  ];

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      color: 'text-indigo-500 dark:text-indigo-400'
    },
    {
      id: 'finance',
      label: 'Finance Tracker',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-indigo-500 dark:text-indigo-400'
    },
    {
      id: 'salary',
      label: 'Salary & Income',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-emerald-500 dark:text-emerald-400'
    },
    {
      id: 'health',
      label: 'Health & Fitness',
      icon: <Heart className="w-5 h-5" />,
      color: 'text-emerald-500 dark:text-emerald-400'
    },
    {
      id: 'productivity',
      label: 'Productivity Tools',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-indigo-500 dark:text-indigo-400'
    },
    {
      id: 'social',
      label: 'Social & Relations',
      icon: <Users className="w-5 h-5" />,
      color: 'text-emerald-500 dark:text-emerald-400'
    },
    {
      id: 'travel',
      label: 'Travel & Location',
      icon: <MapPin className="w-5 h-5" />,
      color: 'text-amber-500 dark:text-amber-400'
    },
    {
      id: 'books',
      label: 'Books & Reading',
      icon: <Book className="w-5 h-5" />,
      color: 'text-amber-500 dark:text-amber-400'
    },
    {
      id: 'utilities',
      label: 'Utilities & Tools',
      icon: <Wrench className="w-5 h-5" />,
      color: 'text-amber-500 dark:text-amber-400'
    }
  ];

  // Check if we're in a utilities subsection
  const isInUtilitiesSubsection = utilitiesSubsections.some(sub => sub.id === activeSection);
  const activeUtilitiesSubsection = utilitiesSubsections.find(sub => sub.id === activeSection);

  const renderContent = () => {
    const contentMap = {
      home: <HomeSection darkMode={darkMode} />,
      finance: <FinanceSection darkMode={darkMode} />,
      salary: <SalarySection darkMode={darkMode} />,
      health: <HealthSection darkMode={darkMode} />,
      productivity: <ProductivitySection darkMode={darkMode} />,
      social: <SocialSection darkMode={darkMode} />,
      travel: <TravelSection darkMode={darkMode} />,
      books: <BooksSection darkMode={darkMode} />,
      utilities: <UtilitiesSection darkMode={darkMode} setActiveSection={setActiveSection} />,
      lakawon: <LakawonSection darkMode={darkMode} setActiveSection={setActiveSection} />
    };
    return contentMap[activeSection] || contentMap['home'];
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-all duration-300 flex flex-col fixed left-0 top-0 h-screen z-50 shadow-lg`}
      >
        {/* Logo */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className={`flex items-center space-x-2 ${!sidebarOpen && 'hidden'}`}>
            <BarChart3 className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            {sidebarOpen ? (
              <X className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
            ) : (
              <Menu className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = item.id === activeSection || (item.id === 'utilities' && isInUtilitiesSubsection);
            const showSubmenu = item.id === 'utilities' && isInUtilitiesSubsection && sidebarOpen;
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(true);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? `${darkMode ? 'bg-indigo-900 text-indigo-300 border-l-4 border-indigo-500' : 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500'}`
                      : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`
                  }`}
                >
                  <span className={item.color}>{item.icon}</span>
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
                
                {/* Utilities Submenu */}
                {showSubmenu && (
                  <div className="ml-4 mt-1 space-y-1">
                    {utilitiesSubsections.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          setActiveSection(subItem.id);
                          setSidebarOpen(true);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition ${
                          activeSection === subItem.id
                            ? `${darkMode ? 'bg-indigo-800 text-indigo-200 border-l-4 border-indigo-400' : 'bg-indigo-100 text-indigo-700 border-l-4 border-indigo-400'}`
                            : `${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`
                        }`}
                      >
                        <span>{subItem.icon}</span>
                        <span className="text-sm font-medium">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Dark Mode Toggle and Logout */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} space-y-2`}>
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              darkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-gray-700 hover:bg-gray-50'
            } ${!sidebarOpen && 'justify-center'}`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {sidebarOpen && <span className="text-sm font-medium">Dark Mode</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
              darkMode 
                ? 'text-gray-300 hover:bg-red-900 hover:text-red-300' 
                : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
            } ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`overflow-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b fixed top-0 right-0 z-40 transition-all duration-300 ${sidebarOpen ? 'left-64' : 'left-20'}`}>
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4 ml-auto">
              {/* Currency Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="Change currency"
                >
                  <span className="text-sm font-medium">{currencies[currency].symbol}</span>
                  <span className="text-xs">{currencies[currency].code}</span>
                </button>
                
                {showCurrencyMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowCurrencyMenu(false)}
                    ></div>
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-20 ${
                      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                      {Object.values(currencies).map((curr) => (
                        <button
                          key={curr.code}
                          onClick={() => {
                            setCurrency(curr.code);
                            setShowCurrencyMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            currency === curr.code
                              ? darkMode
                                ? 'bg-indigo-900 text-indigo-300'
                                : 'bg-indigo-50 text-indigo-600'
                              : darkMode
                                ? 'hover:bg-gray-700 text-gray-300'
                                : 'hover:bg-gray-50 text-gray-700'
                          } ${curr.code === 'USD' ? 'rounded-t-lg' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{curr.name}</span>
                            <span className="font-medium">{curr.symbol}</span>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setShowCurrencyMenu(false);
                          setShowCurrencySettings(true);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors border-t ${
                          darkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        } rounded-b-lg`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Exchange Rates</span>
                          <span className="text-xs">⚙️</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              
              <div className="text-right">
                <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome Back</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{userEmail}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6 pt-24">
          {renderContent()}
        </main>
      </div>

      {/* Currency Settings Modal */}
      {showCurrencySettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowCurrencySettings(false)}>
          <div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-lg shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Exchange Rates</h3>
              <button
                onClick={() => setShowCurrencySettings(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Set buy and sell exchange rates relative to USD (1 USD = X)
            </p>

            <div className="space-y-6 max-h-96 overflow-y-auto">
              {Object.values(currencies).filter(curr => curr.code !== 'USD').map((curr) => (
                <div key={curr.code} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {curr.name} ({curr.code})
                  </label>
                  
                  <div className="space-y-3">
                    {/* Buy Rate */}
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Buy Rate (1 USD = X {curr.code})
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          value={exchangeRates[curr.code]?.buy || ''}
                          onChange={(e) => updateExchangeRate(curr.code, 'buy', e.target.value)}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          placeholder="0.00"
                        />
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{curr.code}</span>
                      </div>
                    </div>
                    
                    {/* Sell Rate */}
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Sell Rate (1 USD = X {curr.code})
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.01"
                          value={exchangeRates[curr.code]?.sell || ''}
                          onChange={(e) => updateExchangeRate(curr.code, 'sell', e.target.value)}
                          className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          placeholder="0.00"
                        />
                        <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{curr.code}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCurrencySettings(false)}
                className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeSection({ darkMode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome to Your Dashboard</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>Manage your life and track progress across all areas</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          icon={<DollarSign className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />}
          title="Monthly Budget"
          value="$2,450"
          subtitle="65% of $3,750"
          color="indigo"
          darkMode={darkMode}
        />
        <DashboardCard
          icon={<Heart className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />}
          title="Daily Activity"
          value="8,234"
          subtitle="steps (82% goal)"
          color="emerald"
          darkMode={darkMode}
        />
        <DashboardCard
          icon={<Clock className="w-8 h-8 text-amber-500 dark:text-amber-400" />}
          title="Productive Hours"
          value="6.5 hrs"
          subtitle="today's focus time"
          color="amber"
          darkMode={darkMode}
        />
      </div>

      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-8 border transition-colors duration-300`}>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Active Goals" value="12" darkMode={darkMode} />
          <StatBox label="Completion Rate" value="94%" darkMode={darkMode} />
          <StatBox label="Upcoming Events" value="3" darkMode={darkMode} />
          <StatBox label="Current Streak" value="47 days" darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}

function FinanceSection({ darkMode }) {
  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Finance Tracker</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Expense Breakdown</h3>
          <div className="space-y-3">
            <ExpenseItem label="Housing" amount="$1,200" percentage={40} darkMode={darkMode} />
            <ExpenseItem label="Food" amount="$450" percentage={15} darkMode={darkMode} />
            <ExpenseItem label="Transport" amount="$300" percentage={10} darkMode={darkMode} />
            <ExpenseItem label="Entertainment" amount="$500" percentage={17} darkMode={darkMode} />
          </div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Recent Transactions</h3>
          <div className="space-y-3">
            <TransactionItem label="Grocery Store" amount="-$87.50" date="Today" darkMode={darkMode} />
            <TransactionItem label="Salary Deposit" amount="+$3,500" date="Yesterday" darkMode={darkMode} />
            <TransactionItem label="Electric Bill" amount="-$125" date="2 days ago" darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}


function HealthSection({ darkMode }) {
  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Health & Fitness</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Weekly Activity</h3>
          <div className="space-y-4">
            <ProgressBar label="Steps" value={8234} max={10000} color="emerald" darkMode={darkMode} />
            <ProgressBar label="Water Intake" value={6} max={8} color="blue" darkMode={darkMode} />
            <ProgressBar label="Sleep" value={7.5} max={8} color="indigo" darkMode={darkMode} />
          </div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Workouts This Week</h3>
          <div className="space-y-2">
            <WorkoutItem day="Monday" time="45 min" type="Running" darkMode={darkMode} />
            <WorkoutItem day="Tuesday" time="60 min" type="Gym" darkMode={darkMode} />
            <WorkoutItem day="Wednesday" time="30 min" type="Yoga" darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductivitySection({ darkMode }) {
  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Productivity Tools</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Today's Tasks</h3>
          <div className="space-y-2">
            <TaskItem title="Complete project report" completed={true} dueDate="Today" darkMode={darkMode} />
            <TaskItem title="Team meeting at 2 PM" completed={false} dueDate="Today" darkMode={darkMode} />
            <TaskItem title="Review email responses" completed={false} dueDate="Today" darkMode={darkMode} />
          </div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Upcoming Deadlines</h3>
          <div className="space-y-3">
            <DeadlineItem title="Q4 Report" days={5} darkMode={darkMode} />
            <DeadlineItem title="Project Presentation" days={12} darkMode={darkMode} />
            <DeadlineItem title="Annual Review" days={20} darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialSection({ darkMode }) {
  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Social & Relationships</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Upcoming Events</h3>
          <div className="space-y-3">
            <EventItem title="Sarah's Birthday" date="Dec 15" type="Birthday" darkMode={darkMode} />
            <EventItem title="Team Dinner" date="Dec 20" type="Social" darkMode={darkMode} />
            <EventItem title="Family Gathering" date="Dec 25" type="Family" darkMode={darkMode} />
          </div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Gift Ideas</h3>
          <div className="space-y-3">
            <GiftItem name="John" occasion="Birthday" status="Idea Found" darkMode={darkMode} />
            <GiftItem name="Emma" occasion="Anniversary" status="Pending" darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TravelSection({ darkMode }) {
  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Travel & Location</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Planned Trips</h3>
          <div className="space-y-3">
            <TripItem destination="Paris" dates="Dec 20 - Jan 5" budget="$2,500" darkMode={darkMode} />
            <TripItem destination="Tokyo" dates="March 10-25" budget="$4,000" darkMode={darkMode} />
          </div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Packing List</h3>
          <div className="space-y-2">
            <PackingItem item="Passport" checked={true} darkMode={darkMode} />
            <PackingItem item="Travel insurance docs" checked={true} darkMode={darkMode} />
            <PackingItem item="Luggage" checked={false} darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BooksSection({ darkMode }) {
  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Books & Reading</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Currently Reading</h3>
          <div className="space-y-4">
            <BookItem title="Atomic Habits" author="James Clear" progress={65} darkMode={darkMode} />
            <BookItem title="Deep Work" author="Cal Newport" progress={42} darkMode={darkMode} />
          </div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Reading Stats</h3>
          <div className="space-y-3">
            <StatLine label="Books Read" value="12" darkMode={darkMode} />
            <StatLine label="Pages This Month" value="342" darkMode={darkMode} />
            <StatLine label="Reading Streak" value="28 days" darkMode={darkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UtilitiesSection({ darkMode, setActiveSection }) {
  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Utilities & Tools</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => setActiveSection('lakawon')}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer transition-colors duration-300`}
        >
          <div className="text-4xl mb-3">
            <img 
              src="/lakawon-icon.jpg" 
              alt="Lakawon" 
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Lakawon</p>
        </div>
        <UtilityCard title="Unit Converter" icon="⚙️" darkMode={darkMode} />
        <UtilityCard title="QR Generator" icon="📱" darkMode={darkMode} />
        <UtilityCard title="Text Tools" icon="📝" darkMode={darkMode} />
        <UtilityCard title="Password Generator" icon="🔐" darkMode={darkMode} />
        <UtilityCard title="JSON Formatter" icon="{ }" darkMode={darkMode} />
        <UtilityCard title="Calculator" icon="🧮" darkMode={darkMode} />
      </div>
    </div>
  );
}

function LakawonSection({ darkMode, setActiveSection }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => setActiveSection('utilities')}
          className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${darkMode ? 'text-gray-300' : 'text-gray-600'} hover:${darkMode ? 'text-white' : 'text-gray-900'}`}
          aria-label="Go back to Utilities"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img 
          src="/lakawon-icon.jpg" 
          alt="Lakawon" 
          className="w-16 h-16 rounded-full object-cover"
        />
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Lakawon</h1>
      </div>
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Welcome to Lakawon. Content coming soon...</p>
      </div>
    </div>
  );
}

// UI Components
function DashboardCard({ icon, title, value, subtitle, color, darkMode }) {
  const bgColor = color === 'indigo' 
    ? (darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50') 
    : color === 'emerald' 
    ? (darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50') 
    : (darkMode ? 'bg-amber-900/30' : 'bg-amber-50');
  return (
    <div className={`${bgColor} ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>{title}</p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>{subtitle}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value, darkMode }) {
  return (
    <div className={`text-center p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg border transition-colors duration-300`}>
      <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</div>
      <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-xs mt-1`}>{label}</div>
    </div>
  );
}

function ExpenseItem({ label, amount, percentage, darkMode }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{amount}</span>
      </div>
      <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
        <div
          className="bg-indigo-500 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function TransactionItem({ label, amount, date, darkMode }) {
  const isPositive = amount.startsWith('+');
  return (
    <div className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg transition-colors duration-300`}>
      <div>
        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{date}</p>
      </div>
      <p className={`text-sm font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : darkMode ? 'text-white' : 'text-gray-900'}`}>
        {amount}
      </p>
    </div>
  );
}

function ProgressBar({ label, value, max, color, darkMode }) {
  const percentage = (value / max) * 100;
  const colorClass = color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : 'bg-indigo-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}/{max}</span>
      </div>
      <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
        <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function WorkoutItem({ day, time, type, darkMode }) {
  return (
    <div className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg transition-colors duration-300`}>
      <div>
        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{day}</p>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{type}</p>
      </div>
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{time}</p>
    </div>
  );
}

function TaskItem({ title, completed, dueDate, darkMode }) {
  return (
    <div className={`flex items-start space-x-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg transition-colors duration-300`}>
      <input type="checkbox" checked={completed} readOnly className="w-5 h-5 mt-0.5" />
      <div className="flex-1">
        <p className={`text-sm ${completed ? `line-through ${darkMode ? 'text-gray-500' : 'text-gray-500'}` : `${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}`}>
          {title}
        </p>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{dueDate}</p>
      </div>
    </div>
  );
}

function DeadlineItem({ title, days, darkMode }) {
  return (
    <div className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg transition-colors duration-300`}>
      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{days}d</span>
    </div>
  );
}

function EventItem({ title, date, type, darkMode }) {
  return (
    <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg transition-colors duration-300`}>
      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <div className="flex justify-between items-center mt-1">
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{date}</p>
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{type}</span>
      </div>
    </div>
  );
}

function GiftItem({ name, occasion, status, darkMode }) {
  return (
    <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg transition-colors duration-300`}>
      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name}</p>
      <div className="flex justify-between items-center mt-1">
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{occasion}</p>
        <span className={`text-xs font-medium ${status === 'Idea Found' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function TripItem({ destination, dates, budget, darkMode }) {
  return (
    <div className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg transition-colors duration-300`}>
      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{destination}</p>
      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{dates}</p>
      <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-2">{budget}</p>
    </div>
  );
}

function PackingItem({ item, checked, darkMode }) {
  return (
    <div className="flex items-center space-x-2 p-2">
      <input type="checkbox" checked={checked} readOnly className="w-4 h-4" />
      <span className={`text-sm ${checked ? `line-through ${darkMode ? 'text-gray-500' : 'text-gray-500'}` : `${darkMode ? 'text-gray-300' : 'text-gray-700'}`}`}>
        {item}
      </span>
    </div>
  );
}

function BookItem({ title, author, progress, darkMode }) {
  return (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{author}</p>
        </div>
        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{progress}%</p>
      </div>
      <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}

function StatLine({ label, value, darkMode }) {
  return (
    <div className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg transition-colors duration-300`}>
      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</p>
      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function UtilityCard({ title, icon, darkMode }) {
  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer transition-colors duration-300`}>
      <div className="text-4xl mb-3">{icon}</div>
      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
    </div>
  );
}

