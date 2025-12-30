import { useState } from 'react';
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
  X
} from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import SalarySection from '../components/SalarySection';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      utilities: <UtilitiesSection darkMode={darkMode} />
    };
    return contentMap[activeSection] || contentMap['home'];
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex transition-colors duration-300`}>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-all duration-300 flex flex-col fixed lg:relative h-screen z-50 lg:z-auto shadow-lg lg:shadow-none`}
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
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(true);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeSection === item.id
                  ? `${darkMode ? 'bg-indigo-900 text-indigo-300 border-l-4 border-indigo-500' : 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500'}`
                  : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`
              }`}
            >
              <span className={item.color}>{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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
      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Header */}
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40 transition-colors duration-300`}>
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4 ml-auto">
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
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
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

function UtilitiesSection({ darkMode }) {
  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Utilities & Tools</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

