import { useState } from 'react';
import {
  DollarSign,
  Heart,
  Clock,
  Users,
  MapPin,
  Wrench,
  BarChart3,
  LogOut,
  ChevronDown,
  Home,
  TrendingUp,
  Book,
  Menu,
  X
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      color: 'text-indigo-500'
    },
    {
      id: 'finance',
      label: 'Finance Tracker',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-indigo-500'
    },
    {
      id: 'salary',
      label: 'Salary & Income',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-emerald-500'
    },
    {
      id: 'health',
      label: 'Health & Fitness',
      icon: <Heart className="w-5 h-5" />,
      color: 'text-emerald-500'
    },
    {
      id: 'productivity',
      label: 'Productivity Tools',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-indigo-500'
    },
    {
      id: 'social',
      label: 'Social & Relations',
      icon: <Users className="w-5 h-5" />,
      color: 'text-emerald-500'
    },
    {
      id: 'travel',
      label: 'Travel & Location',
      icon: <MapPin className="w-5 h-5" />,
      color: 'text-amber-500'
    },
    {
      id: 'books',
      label: 'Books & Reading',
      icon: <Book className="w-5 h-5" />,
      color: 'text-amber-500'
    },
    {
      id: 'utilities',
      label: 'Utilities & Tools',
      icon: <Wrench className="w-5 h-5" />,
      color: 'text-amber-500'
    }
  ];

  const renderContent = () => {
    const contentMap: { [key: string]: JSX.Element } = {
      home: <HomeSection />,
      finance: <FinanceSection />,
      salary: <SalarySection />,
      health: <HealthSection />,
      productivity: <ProductivitySection />,
      social: <SocialSection />,
      travel: <TravelSection />,
      books: <BooksSection />,
      utilities: <UtilitiesSection />
    };
    return contentMap[activeSection] || contentMap['home'];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed lg:relative h-screen z-50 lg:z-auto shadow-lg lg:shadow-none`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className={`flex items-center space-x-2 ${!sidebarOpen && 'hidden'}`}>
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            <span className="text-lg font-bold text-gray-900">Dashboard</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
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
                  ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className={`${item.color}`}>{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">Welcome Back</p>
                <p className="text-xs text-gray-600">user@example.com</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                U
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

function HomeSection() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Your Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your life and track progress across all areas</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          icon={<DollarSign className="w-8 h-8 text-indigo-500" />}
          title="Monthly Budget"
          value="$2,450"
          subtitle="65% of $3,750"
          color="indigo"
        />
        <DashboardCard
          icon={<Heart className="w-8 h-8 text-emerald-500" />}
          title="Daily Activity"
          value="8,234"
          subtitle="steps (82% goal)"
          color="emerald"
        />
        <DashboardCard
          icon={<Clock className="w-8 h-8 text-amber-500" />}
          title="Productive Hours"
          value="6.5 hrs"
          subtitle="today's focus time"
          color="amber"
        />
      </div>

      <div className="bg-white rounded-xl p-8 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Active Goals" value="12" />
          <StatBox label="Completion Rate" value="94%" />
          <StatBox label="Upcoming Events" value="3" />
          <StatBox label="Current Streak" value="47 days" />
        </div>
      </div>
    </div>
  );
}

function FinanceSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Finance Tracker</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            <ExpenseItem label="Housing" amount="$1,200" percentage={40} />
            <ExpenseItem label="Food" amount="$450" percentage={15} />
            <ExpenseItem label="Transport" amount="$300" percentage={10} />
            <ExpenseItem label="Entertainment" amount="$500" percentage={17} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            <TransactionItem label="Grocery Store" amount="-$87.50" date="Today" />
            <TransactionItem label="Salary Deposit" amount="+$3,500" date="Yesterday" />
            <TransactionItem label="Electric Bill" amount="-$125" date="2 days ago" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SalarySection() {
  const [income, setIncome] = useState<{ source: string; amount: number; date: string }[]>([
    { source: 'Monthly Salary', amount: 3500, date: '2024-12-01' },
    { source: 'Freelance Work', amount: 500, date: '2024-12-15' }
  ]);
  const [expenses, setExpenses] = useState<{ category: string; amount: number; date: string }[]>([
    { category: 'Rent', amount: 1200, date: '2024-12-01' },
    { category: 'Groceries', amount: 300, date: '2024-12-10' },
    { category: 'Utilities', amount: 150, date: '2024-12-05' }
  ]);
  const [debts, setDebts] = useState<{ person: string; amount: number; date: string; description: string }[]>([
    { person: 'John', amount: 200, date: '2024-12-05', description: 'Lunch money' }
  ]);
  const [loans, setLoans] = useState<{ person: string; amount: number; date: string; description: string }[]>([
    { person: 'Mike', amount: 500, date: '2024-12-03', description: 'Car repair fund' }
  ]);
  const [savings, setSavings] = useState<{ description: string; amount: number; date: string }[]>([
    { description: 'Emergency Fund', amount: 2000, date: '2024-12-01' },
    { description: 'Vacation Fund', amount: 500, date: '2024-12-10' }
  ]);

  const [newIncome, setNewIncome] = useState({ source: '', amount: '' });
  const [newExpense, setNewExpense] = useState({ category: '', amount: '' });
  const [newDebt, setNewDebt] = useState({ person: '', amount: '', description: '' });
  const [newLoan, setNewLoan] = useState({ person: '', amount: '', description: '' });
  const [newSaving, setNewSaving] = useState({ description: '', amount: '' });

  const monthlyIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const ytdIncome = monthlyIncome * 12;
  const monthlyExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalDebts = debts.reduce((sum, item) => sum + item.amount, 0);
  const totalLoans = loans.reduce((sum, item) => sum + item.amount, 0);
  const totalSavings = savings.reduce((sum, item) => sum + item.amount, 0);
  const availableMoney = monthlyIncome - monthlyExpenses - totalDebts;

  const addIncome = () => {
    if (newIncome.source && newIncome.amount) {
      setIncome([...income, { source: newIncome.source, amount: parseFloat(newIncome.amount), date: new Date().toISOString().split('T')[0] }]);
      setNewIncome({ source: '', amount: '' });
    }
  };

  const addExpense = () => {
    if (newExpense.category && newExpense.amount) {
      setExpenses([...expenses, { category: newExpense.category, amount: parseFloat(newExpense.amount), date: new Date().toISOString().split('T')[0] }]);
      setNewExpense({ category: '', amount: '' });
    }
  };

  const addDebt = () => {
    if (newDebt.person && newDebt.amount) {
      setDebts([...debts, { person: newDebt.person, amount: parseFloat(newDebt.amount), date: new Date().toISOString().split('T')[0], description: newDebt.description }]);
      setNewDebt({ person: '', amount: '', description: '' });
    }
  };

  const addLoan = () => {
    if (newLoan.person && newLoan.amount) {
      setLoans([...loans, { person: newLoan.person, amount: parseFloat(newLoan.amount), date: new Date().toISOString().split('T')[0], description: newLoan.description }]);
      setNewLoan({ person: '', amount: '', description: '' });
    }
  };

  const addSaving = () => {
    if (newSaving.description && newSaving.amount) {
      setSavings([...savings, { description: newSaving.description, amount: parseFloat(newSaving.amount), date: new Date().toISOString().split('T')[0] }]);
      setNewSaving({ description: '', amount: '' });
    }
  };

  const removeIncome = (index: number) => setIncome(income.filter((_, i) => i !== index));
  const removeExpense = (index: number) => setExpenses(expenses.filter((_, i) => i !== index));
  const removeDebt = (index: number) => setDebts(debts.filter((_, i) => i !== index));
  const removeLoan = (index: number) => setLoans(loans.filter((_, i) => i !== index));
  const removeSaving = (index: number) => setSavings(savings.filter((_, i) => i !== index));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Salary & Income</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        <MetricCard label="Monthly Income" value={`$${monthlyIncome}`} color="emerald" />
        <MetricCard label="YTD Income" value={`$${ytdIncome}`} color="emerald" />
        <MetricCard label="Saved Money" value={`$${totalSavings}`} color="blue" />
        <MetricCard label="Available Money" value={`$${availableMoney}`} color={availableMoney >= 0 ? 'emerald' : 'red'} />
        <MetricCard label="Monthly Expenses" value={`$${monthlyExpenses}`} color="red" />
        <MetricCard label="Total Debts" value={`$${totalDebts}`} color="amber" />
        <MetricCard label="Total Loans" value={`$${totalLoans}`} color="cyan" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Income Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Income</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Source"
              value={newIncome.source}
              onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-gray-50 text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newIncome.amount}
              onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-gray-50 text-sm"
            />
            <button
              onClick={addIncome}
              className="w-full px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-medium"
            >
              Add
            </button>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {income.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-xs">{item.source}</p>
                    <p className="text-gray-500 text-xs">{item.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-emerald-600 text-xs">${item.amount}</p>
                    <button onClick={() => removeIncome(i)} className="text-red-500 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Expenses</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Category"
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none bg-gray-50 text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none bg-gray-50 text-sm"
            />
            <button
              onClick={addExpense}
              className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
            >
              Add
            </button>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {expenses.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-xs">{item.category}</p>
                    <p className="text-gray-500 text-xs">{item.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-red-600 text-xs">${item.amount}</p>
                    <button onClick={() => removeExpense(i)} className="text-red-500 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loans Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Loans Given</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Person"
              value={newLoan.person}
              onChange={(e) => setNewLoan({ ...newLoan, person: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none bg-gray-50 text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newLoan.amount}
              onChange={(e) => setNewLoan({ ...newLoan, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none bg-gray-50 text-sm"
            />
            <input
              type="text"
              placeholder="Description"
              value={newLoan.description}
              onChange={(e) => setNewLoan({ ...newLoan, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none bg-gray-50 text-sm"
            />
            <button
              onClick={addLoan}
              className="w-full px-3 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition text-sm font-medium"
            >
              Add
            </button>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {loans.map((item, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-xs">{item.person}</p>
                      <p className="text-gray-600 text-xs">{item.description}</p>
                      <p className="text-gray-500 text-xs">{item.date}</p>
                    </div>
                    <div className="flex items-center space-x-1 ml-1">
                      <p className="font-bold text-cyan-600 text-xs">${item.amount}</p>
                      <button onClick={() => removeLoan(i)} className="text-red-500 text-xs">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Debts Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Debts</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Person"
              value={newDebt.person}
              onChange={(e) => setNewDebt({ ...newDebt, person: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-gray-50 text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newDebt.amount}
              onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-gray-50 text-sm"
            />
            <input
              type="text"
              placeholder="Description"
              value={newDebt.description}
              onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-gray-50 text-sm"
            />
            <button
              onClick={addDebt}
              className="w-full px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm font-medium"
            >
              Add
            </button>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {debts.map((item, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-xs">{item.person}</p>
                      <p className="text-gray-600 text-xs">{item.description}</p>
                      <p className="text-gray-500 text-xs">{item.date}</p>
                    </div>
                    <div className="flex items-center space-x-1 ml-1">
                      <p className="font-bold text-amber-600 text-xs">${item.amount}</p>
                      <button onClick={() => removeDebt(i)} className="text-red-500 text-xs">✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Savings Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Savings</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Purpose"
              value={newSaving.description}
              onChange={(e) => setNewSaving({ ...newSaving, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-gray-50 text-sm"
            />
            <input
              type="number"
              placeholder="Amount"
              value={newSaving.amount}
              onChange={(e) => setNewSaving({ ...newSaving, amount: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-gray-50 text-sm"
            />
            <button
              onClick={addSaving}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
            >
              Add
            </button>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {savings.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-xs">{item.description}</p>
                    <p className="text-gray-500 text-xs">{item.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-blue-600 text-xs">${item.amount}</p>
                    <button onClick={() => removeSaving(i)} className="text-red-500 text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Health & Fitness</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Activity</h3>
          <div className="space-y-4">
            <ProgressBar label="Steps" value={8234} max={10000} color="emerald" />
            <ProgressBar label="Water Intake" value={6} max={8} color="blue" />
            <ProgressBar label="Sleep" value={7.5} max={8} color="indigo" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Workouts This Week</h3>
          <div className="space-y-2">
            <WorkoutItem day="Monday" time="45 min" type="Running" />
            <WorkoutItem day="Tuesday" time="60 min" type="Gym" />
            <WorkoutItem day="Wednesday" time="30 min" type="Yoga" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductivitySection() {
  const [tasks, setTasks] = useState<{ id: string; time: string; title: string; completed: boolean }[]>([
    { id: '1', time: '09:00', title: 'Complete project report', completed: true },
    { id: '2', time: '14:00', title: 'Team meeting', completed: false },
    { id: '3', time: '16:30', title: 'Review email responses', completed: false }
  ]);

  const [yearlyPlans, setYearlyPlans] = useState<string[]>(['Launch new product', 'Expand market reach', 'Build team']);
  const [monthlyPlans, setMonthlyPlans] = useState<string[]>(['Complete Q1 targets', 'Improve team performance', 'Client onboarding']);

  const [newTask, setNewTask] = useState({ time: '09:00', title: '' });
  const [newYearlyPlan, setNewYearlyPlan] = useState('');
  const [newMonthlyPlan, setNewMonthlyPlan] = useState('');

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonth = monthNames[new Date().getMonth()];

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const productivityPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const addTask = () => {
    if (newTask.title) {
      setTasks([...tasks, { id: Date.now().toString(), time: newTask.time, title: newTask.title, completed: false }]);
      setNewTask({ time: '09:00', title: '' });
    }
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const addYearlyPlan = () => {
    if (newYearlyPlan) {
      setYearlyPlans([...yearlyPlans, newYearlyPlan]);
      setNewYearlyPlan('');
    }
  };

  const addMonthlyPlan = () => {
    if (newMonthlyPlan) {
      setMonthlyPlans([...monthlyPlans, newMonthlyPlan]);
      setNewMonthlyPlan('');
    }
  };

  const deleteYearlyPlan = (index: number) => {
    setYearlyPlans(yearlyPlans.filter((_, i) => i !== index));
  };

  const deleteMonthlyPlan = (index: number) => {
    setMonthlyPlans(monthlyPlans.filter((_, i) => i !== index));
  };

  const weeklyData = [45, 62, 55, 78, 68, 85, 70];
  const monthlyData = [60, 65, 70, 72, 75, 78, 80, 82, 85, 87, 89, 91];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Productivity</h1>
        <div className="text-2xl font-semibold text-gray-700">{currentMonth}</div>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Today's Tasks */}
        <div className="md:col-span-2 lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Tasks</h2>

          <div className="space-y-3 mb-4">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="w-5 h-5 cursor-pointer"
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                </div>
                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">{task.time}</span>
                <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700 text-sm">✕</button>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="time"
                value={newTask.time}
                onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Add task..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
              />
            </div>
            <button
              onClick={addTask}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Productivity Pie Chart */}
        <div className="md:col-span-1 lg:col-span-1 bg-white rounded-xl p-6 border border-gray-200 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-gray-900 mb-4 w-full">Today's Progress</h3>
          <div className="relative w-32 h-32 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="10"
                strokeDasharray={`${productivityPercent * 2.83} 283`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{productivityPercent}%</p>
                <p className="text-xs text-gray-600">{completedTasks}/{totalTasks}</p>
              </div>
            </div>
          </div>
          <div className="text-sm text-center">
            <p className="text-gray-700 font-medium">{completedTasks} of {totalTasks} completed</p>
          </div>
        </div>

        {/* Plans Side */}
        <div className="md:col-span-1 lg:col-span-1 space-y-4">
          {/* Yearly Plans */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Yearly Plans</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
              {yearlyPlans.map((plan, i) => (
                <div key={i} className="flex justify-between items-start p-2 bg-amber-50 rounded text-xs">
                  <span className="text-gray-700">{plan}</span>
                  <button onClick={() => deleteYearlyPlan(i)} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              ))}
            </div>
            <div className="flex space-x-1">
              <input
                type="text"
                placeholder="Add plan..."
                value={newYearlyPlan}
                onChange={(e) => setNewYearlyPlan(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addYearlyPlan()}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
              />
              <button onClick={addYearlyPlan} className="px-2 py-1 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600">+</button>
            </div>
          </div>

          {/* Monthly Plans */}
          <div className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Monthly Plans</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
              {monthlyPlans.map((plan, i) => (
                <div key={i} className="flex justify-between items-start p-2 bg-green-50 rounded text-xs">
                  <span className="text-gray-700">{plan}</span>
                  <button onClick={() => deleteMonthlyPlan(i)} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              ))}
            </div>
            <div className="flex space-x-1">
              <input
                type="text"
                placeholder="Add plan..."
                value={newMonthlyPlan}
                onChange={(e) => setNewMonthlyPlan(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMonthlyPlan()}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none"
              />
              <button onClick={addMonthlyPlan} className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly and Monthly Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Productivity */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Productivity</h3>
          <div className="flex items-end justify-between h-40 gap-2 px-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="flex flex-col items-center flex-1">
                <div className="w-full bg-gradient-to-b from-blue-400 to-blue-500 rounded-t" style={{ height: `${(weeklyData[i] / 100) * 120}px` }}></div>
                <p className="text-xs text-gray-600 mt-2 font-medium">{day}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4 text-center">Average: {Math.round(weeklyData.reduce((a, b) => a + b) / weeklyData.length)}%</p>
        </div>

        {/* Monthly Productivity */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Productivity Trend</h3>
          <div className="flex items-end justify-between h-40 gap-1">
            {monthlyData.map((value, i) => (
              <div key={i} className="flex-1 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-t hover:opacity-80 transition" style={{ height: `${(value / 100) * 120}px` }} title={`Week ${i + 1}: ${value}%`}></div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-4 text-center">Trend: Improving productivity throughout the month</p>
        </div>
      </div>
    </div>
  );
}

function SocialSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Social & Relationships</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            <EventItem title="Sarah's Birthday" date="Dec 15" type="Birthday" />
            <EventItem title="Team Dinner" date="Dec 20" type="Social" />
            <EventItem title="Family Gathering" date="Dec 25" type="Family" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Gift Ideas</h3>
          <div className="space-y-3">
            <GiftItem name="John" occasion="Birthday" status="Idea Found" />
            <GiftItem name="Emma" occasion="Anniversary" status="Pending" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TravelSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Travel & Location</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Planned Trips</h3>
          <div className="space-y-3">
            <TripItem destination="Paris" dates="Dec 20 - Jan 5" budget="$2,500" />
            <TripItem destination="Tokyo" dates="March 10-25" budget="$4,000" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Packing List</h3>
          <div className="space-y-2">
            <PackingItem item="Passport" checked={true} />
            <PackingItem item="Travel insurance docs" checked={true} />
            <PackingItem item="Luggage" checked={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BooksSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Books & Reading</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Currently Reading</h3>
          <div className="space-y-4">
            <BookItem title="Atomic Habits" author="James Clear" progress={65} />
            <BookItem title="Deep Work" author="Cal Newport" progress={42} />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Reading Stats</h3>
          <div className="space-y-3">
            <StatLine label="Books Read" value="12" />
            <StatLine label="Pages This Month" value="342" />
            <StatLine label="Reading Streak" value="28 days" />
          </div>
        </div>
      </div>
    </div>
  );
}

function UtilitiesSection() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Utilities & Tools</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UtilityCard title="Unit Converter" icon="⚙️" />
        <UtilityCard title="QR Generator" icon="📱" />
        <UtilityCard title="Text Tools" icon="📝" />
        <UtilityCard title="Password Generator" icon="🔐" />
        <UtilityCard title="JSON Formatter" icon="{ }" />
        <UtilityCard title="Calculator" icon="🧮" />
      </div>
    </div>
  );
}

// UI Components
function DashboardCard({
  icon,
  title,
  value,
  subtitle,
  color
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  const bgColor = color === 'indigo' ? 'bg-indigo-50' : color === 'emerald' ? 'bg-emerald-50' : 'bg-amber-50';
  return (
    <div className={`${bgColor} rounded-xl p-6 border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function ExpenseItem({ label, amount, percentage }: { label: string; amount: string; percentage: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-900">{amount}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function TransactionItem({ label, amount, date }: { label: string; amount: string; date: string }) {
  const isPositive = amount.startsWith('+');
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
      <p className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-gray-900'}`}>
        {amount}
      </p>
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = (value / max) * 100;
  const colorClass = color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : 'bg-indigo-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function WorkoutItem({ day, time, type }: { day: string; time: string; type: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="text-sm font-medium text-gray-900">{day}</p>
        <p className="text-xs text-gray-600">{type}</p>
      </div>
      <p className="text-sm font-medium text-emerald-600">{time}</p>
    </div>
  );
}

function TaskItem({ title, completed, dueDate }: { title: string; completed: boolean; dueDate: string }) {
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
      <input type="checkbox" checked={completed} readOnly className="w-5 h-5 mt-0.5" />
      <div className="flex-1">
        <p className={`text-sm ${completed ? 'line-through text-gray-500' : 'text-gray-900 font-medium'}`}>
          {title}
        </p>
        <p className="text-xs text-gray-500">{dueDate}</p>
      </div>
    </div>
  );
}

function DeadlineItem({ title, days }: { title: string; days: number }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <span className="text-sm font-bold text-amber-600">{days}d</span>
    </div>
  );
}

function EventItem({ title, date, type }: { title: string; date: string; type: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-gray-600">{date}</p>
        <span className="text-xs font-medium text-indigo-600">{type}</span>
      </div>
    </div>
  );
}

function GiftItem({ name, occasion, status }: { name: string; occasion: string; status: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-sm font-medium text-gray-900">{name}</p>
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-gray-600">{occasion}</p>
        <span className={`text-xs font-medium ${status === 'Idea Found' ? 'text-emerald-600' : 'text-amber-600'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function TripItem({ destination, dates, budget }: { destination: string; dates: string; budget: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-sm font-medium text-gray-900">{destination}</p>
      <p className="text-xs text-gray-600 mt-1">{dates}</p>
      <p className="text-sm font-bold text-amber-600 mt-2">{budget}</p>
    </div>
  );
}

function PackingItem({ item, checked }: { item: string; checked: boolean }) {
  return (
    <div className="flex items-center space-x-2 p-2">
      <input type="checkbox" checked={checked} readOnly className="w-4 h-4" />
      <span className={`text-sm ${checked ? 'line-through text-gray-500' : 'text-gray-700'}`}>
        {item}
      </span>
    </div>
  );
}

function BookItem({ title, author, progress }: { title: string; author: string; progress: number }) {
  return (
    <div>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-600">{author}</p>
        </div>
        <p className="text-xs font-medium text-indigo-600">{progress}%</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}

function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-700">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function UtilityCard({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: { [key: string]: string } = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700'
  };

  return (
    <div className={`rounded-xl p-3 border ${colorClasses[color] || colorClasses.emerald}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: { [key: string]: string } = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
