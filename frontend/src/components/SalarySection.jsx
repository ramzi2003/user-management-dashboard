import { useState, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function SalarySection({ darkMode }) {
  const { formatCurrency, currencies, currency: selectedCurrency } = useCurrency();
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [savings, setSavings] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get user ID from localStorage
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userInfo.id;

  // Form states
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showSavingsForm, setShowSavingsForm] = useState(false);

  // Load data and summary from API
  const loadData = async () => {
    // Check if user has a token (is logged in)
    const token = localStorage.getItem('token');
    if (!userId || !token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [incomesRes, expensesRes, debtsRes, loansRes, savingsRes, summaryRes] = await Promise.all([
        api.get(`/api/salary/incomes/?user_id=${userId}`),
        api.get(`/api/salary/expenses/?user_id=${userId}`),
        api.get(`/api/salary/debts/?user_id=${userId}`),
        api.get(`/api/salary/loans/?user_id=${userId}`),
        api.get(`/api/salary/savings/?user_id=${userId}`),
        api.get(`/api/salary/summary/?user_id=${userId}&currency=${selectedCurrency}`)
      ]);
      
      setIncomes(incomesRes.data || []);
      setExpenses(expensesRes.data || []);
      setDebts(debtsRes.data || []);
      setLoans(loansRes.data || []);
      setSavings(parseFloat(savingsRes.data?.amount || 0));
      setSummary(summaryRes.data);
    } catch (error) {
      // Only show error if it's not a 401 (unauthorized) - user just needs to log in
      if (error.response?.status !== 401) {
        console.error('Error loading salary data:', error);
        toast.error('Failed to load salary data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when currency changes
  useEffect(() => {
    loadData();
  }, [userId, selectedCurrency]);

  // All calculations are done in the backend - just use summary values
  const monthlyIncome = summary?.monthly_income || 0;
  const yearlyIncome = summary?.ytd_income || 0;
  const totalExpenses = summary?.total_expenses || 0;
  const netSavings = summary?.available_money || 0;
  const allDebts = summary?.total_debts || 0;
  const allLoans = summary?.total_loans || 0;

  // Save functions - reload data and summary after changes
  const saveIncomes = async (newIncomes) => {
    setIncomes(newIncomes);
    await loadData(); // Reload summary
  };

  const saveExpenses = async (newExpenses) => {
    setExpenses(newExpenses);
    await loadData(); // Reload summary
  };

  const saveDebts = async (newDebts) => {
    setDebts(newDebts);
    await loadData(); // Reload summary
  };

  const saveLoans = async (newLoans) => {
    setLoans(newLoans);
    await loadData(); // Reload summary
  };

  const saveSavings = async (newSavings) => {
    if (!userId) return;
    try {
      await api.patch(`/api/salary/savings/update/`, {
        user_id: userId,
        amount: newSavings
      });
      setSavings(newSavings);
      await loadData(); // Reload summary
    } catch (error) {
      console.error('Error saving savings:', error);
      toast.error('Failed to save savings');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Salary & Income</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading salary data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Salary & Income</h1>
      
      {/* Summary Cards */}
      <div className="grid md:grid-cols-5 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Monthly Income</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyIncome, false).display}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>This month</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>YTD Income</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(yearlyIncome, false).display}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>Year to date</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Saved Money</p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(summary?.savings || 0, false).display}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>Total saved</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Available Money</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(netSavings, false).display}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>Current balance</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Monthly Expenses</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses, false).display}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>This month</p>
        </div>
      </div>

      {/* Debts and Loans Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Total Debts (Owed)</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(allDebts, false).display}</p>
          </div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Total Loans (Lent)</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(allLoans, false).display}</p>
          </div>
        </div>
      </div>

      {/* Income Section */}
      <IncomeManager 
        incomes={incomes} 
        onSave={saveIncomes} 
        showForm={showIncomeForm} 
        setShowForm={setShowIncomeForm}
        darkMode={darkMode} 
      />

      {/* Expenses Section */}
      <ExpenseManager 
        expenses={expenses} 
        onSave={saveExpenses} 
        showForm={showExpenseForm} 
        setShowForm={setShowExpenseForm}
        darkMode={darkMode} 
      />

      {/* Debts Section */}
      <DebtManager 
        debts={debts} 
        onSave={saveDebts} 
        expenses={expenses}
        onSaveExpenses={saveExpenses}
        onReload={loadData}
        showForm={showDebtForm} 
        setShowForm={setShowDebtForm}
        darkMode={darkMode} 
      />

      {/* Loans Section */}
      <LoanManager 
        loans={loans} 
        onSave={saveLoans} 
        onReload={loadData}
        showForm={showLoanForm} 
        setShowForm={setShowLoanForm}
        darkMode={darkMode}
        incomes={incomes}
        onSaveIncomes={saveIncomes}
      />

      {/* Savings Section */}
      <SavingsManager 
        savings={savings} 
        summary={summary}
        onSave={saveSavings} 
        showForm={showSavingsForm} 
        setShowForm={setShowSavingsForm}
        darkMode={darkMode} 
      />
    </div>
  );
}

// Manager Components
function IncomeManager({ incomes, onSave, showForm, setShowForm, darkMode }) {
  const { currencies } = useCurrency();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeCurrency, setIncomeCurrency] = useState('USD');
  const [showAllIncomes, setShowAllIncomes] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const DISPLAY_LIMIT = 4;
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userInfo.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !date || !userId) return;
    
    setLoading(true);
    try {
      const response = await api.post('/api/salary/incomes/create/', {
        user_id: userId,
        description,
        amount: parseFloat(amount),
        date,
        currency: incomeCurrency
      });
      onSave([...incomes, response.data]);
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      await loadData(); // Reload summary
      toast.success('Income added successfully');
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error(error.response?.data?.error || 'Failed to add income');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!userId) return;
    setLoading(true);
    try {
      await api.delete(`/api/salary/incomes/${id}/delete/?user_id=${userId}`);
      onSave(incomes.filter(inc => inc.id !== id));
      await loadData(); // Reload summary
      toast.success('Income deleted successfully');
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error(error.response?.data?.error || 'Failed to delete income');
    } finally {
      setLoading(false);
    }
  };

  const currentMonthIncomes = incomes.filter(inc => {
    const incDate = new Date(inc.date);
    const now = new Date();
    return incDate.getMonth() === now.getMonth() && incDate.getFullYear() === now.getFullYear();
  });

  return (
    <>
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
        <div className="flex justify-between items-center mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Income This Month</h3>
        <button
            onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition"
        >
            + Add Income
        </button>
      </div>

        {/* Visualization - Card Grid */}
        {currentMonthIncomes.length === 0 ? (
          <div className="text-center py-12">
            <div className={`inline-block p-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mb-4`}>
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No income entries this month</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Click "+ Add Income" to get started</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentMonthIncomes.slice(0, DISPLAY_LIMIT).map(income => (
              <div 
                key={income.id} 
                className={`relative p-5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-xl transition-all duration-200 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-sm hover:shadow-md`}
              >
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(income.id)}
                  className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-500 text-red-400 hover:text-red-300' : 'hover:bg-gray-200 text-red-500 hover:text-red-600'}`}
                  title="Delete income"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Card Content */}
                <div className="pr-8">
                  <h4 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    {income.description}
                  </h4>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Date</p>
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(income.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Amount</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {(() => {
                          const curr = income.currency || 'USD';
                          const currInfo = currencies[curr];
                          const formatted = parseFloat(income.amount).toLocaleString(currInfo.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          return curr === 'USD' ? `${currInfo.symbol}${formatted}` : `${currInfo.symbol} ${formatted}`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
            
            {currentMonthIncomes.length > DISPLAY_LIMIT && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllIncomes(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  View All ({currentMonthIncomes.length} total)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* View All Incomes Modal */}
      {showAllIncomes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowAllIncomes(false)}>
          <div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                All Income Entries ({currentMonthIncomes.length})
              </h3>
              <button
                onClick={() => setShowAllIncomes(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentMonthIncomes.map(income => (
                <div 
                  key={income.id} 
                  className={`relative p-5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-xl transition-all duration-200 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} shadow-sm`}
                >
                  <button
                    onClick={() => {
                      handleDelete(income.id);
                      if (currentMonthIncomes.length === 1) setShowAllIncomes(false);
                    }}
                    className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-500 text-red-400 hover:text-red-300' : 'hover:bg-gray-200 text-red-500 hover:text-red-600'}`}
                    title="Delete income"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="pr-8">
                    <h4 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {income.description}
                    </h4>
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Date</p>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {new Date(income.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Amount</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {(() => {
                            const curr = income.currency || 'USD';
                            const currInfo = currencies[curr];
                            const formatted = parseFloat(income.amount).toLocaleString(currInfo.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return curr === 'USD' ? `${currInfo.symbol}${formatted}` : `${currInfo.symbol} ${formatted}`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding Income */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowForm(false)}>
          <div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add New Income</h3>
              <button
                onClick={() => setShowForm(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
          <input
            type="text"
                  placeholder="e.g., Salary, Freelance, Bonus"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
                  autoFocus
          />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount
                </label>
          <input
            type="number"
            step="0.01"
                  placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
          />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Currency
                </label>
                <select
                  value={incomeCurrency}
                  onChange={(e) => setIncomeCurrency(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  required
                >
                  {Object.values(currencies).map(curr => (
                    <option key={curr.code} value={curr.code}>{curr.name} ({curr.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date
                </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
          />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition"
                >
                  Add Income
                </button>
              </div>
            </form>
            </div>
      </div>
      )}
    </>
  );
}

function ExpenseManager({ expenses, onSave, showForm, setShowForm, darkMode }) {
  const { currencies } = useCurrency();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseCurrency, setExpenseCurrency] = useState('USD');
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  
  const DISPLAY_LIMIT = 4;
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userInfo.id;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !date || !userId) return;
    
    setLoading(true);
    try {
      const response = await api.post('/api/salary/expenses/create/', {
        user_id: userId,
        description,
        amount: parseFloat(amount),
        date,
        currency: expenseCurrency
      });
      onSave([...expenses, response.data]);
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setExpenseCurrency('USD');
      setShowForm(false);
      await loadData(); // Reload summary
      toast.success('Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error(error.response?.data?.error || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!userId) return;
    setLoading(true);
    try {
      await api.delete(`/api/salary/expenses/${id}/delete/?user_id=${userId}`);
      onSave(expenses.filter(exp => exp.id !== id));
      await loadData(); // Reload summary
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error(error.response?.data?.error || 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const currentMonthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    const now = new Date();
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
  });

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Expenses This Month</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
        >
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Description (e.g., Groceries, Rent)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
            required
          />
          <select
            value={expenseCurrency}
            onChange={(e) => setExpenseCurrency(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
            required
          >
            {Object.values(currencies).map(curr => (
              <option key={curr.code} value={curr.code}>{curr.name} ({curr.code})</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
            required
          />
          <button type="submit" className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition">
            Add Expense
          </button>
        </form>
      )}

      <div className="space-y-2">
        {currentMonthExpenses.length === 0 ? (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No expenses this month</p>
        ) : (
          <>
            {currentMonthExpenses.slice(0, DISPLAY_LIMIT).map(expense => (
            <div key={expense.id} className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{expense.description}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(expense.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  {(() => {
                    const curr = expense.currency || 'USD';
                    const currInfo = currencies[curr];
                    const formatted = parseFloat(expense.amount).toLocaleString(currInfo.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return curr === 'USD' ? `${currInfo.symbol}${formatted}` : `${currInfo.symbol} ${formatted}`;
                  })()}
                </p>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
            ))}
            
            {currentMonthExpenses.length > DISPLAY_LIMIT && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllExpenses(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  View All ({currentMonthExpenses.length} total)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* View All Expenses Modal */}
      {showAllExpenses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowAllExpenses(false)}>
          <div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                All Expenses ({currentMonthExpenses.length})
              </h3>
              <button
                onClick={() => setShowAllExpenses(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {currentMonthExpenses.map(expense => (
                <div key={expense.id} className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{expense.description}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      {(() => {
                        const curr = expense.currency || 'USD';
                        const currInfo = currencies[curr];
                        const formatted = parseFloat(expense.amount).toLocaleString(currInfo.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        return curr === 'USD' ? `${currInfo.symbol}${formatted}` : `${currInfo.symbol} ${formatted}`;
                      })()}
                    </p>
                    <button
                      onClick={() => {
                        handleDelete(expense.id);
                        if (currentMonthExpenses.length === 1) setShowAllExpenses(false);
                      }}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DebtManager({ debts, onSave, expenses, onSaveExpenses, onReload, showForm, setShowForm, darkMode }) {
  const { currencies } = useCurrency();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [debtCurrency, setDebtCurrency] = useState('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllDebts, setShowAllDebts] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const DISPLAY_LIMIT = 4;
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userInfo.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!person || !amount || !userId) return;
    
    setLoading(true);
    try {
      const response = await api.post('/api/salary/debts/create/', {
        user_id: userId,
        person,
        amount: parseFloat(amount),
        description: description || 'No description',
        currency: debtCurrency,
        date: date
      });
      onSave([...debts, response.data]);
      setPerson('');
      setAmount('');
      setDescription('');
      setDebtCurrency('USD');
      setDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      await loadData(); // Reload summary
      toast.success('Debt added successfully');
    } catch (error) {
      console.error('Error adding debt:', error);
      toast.error(error.response?.data?.error || 'Failed to add debt');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!userId) return;
    setLoading(true);
    try {
      await api.delete(`/api/salary/debts/${id}/delete/?user_id=${userId}`);
      onSave(debts.filter(debt => debt.id !== id));
      await loadData(); // Reload summary
      toast.success('Debt deleted successfully');
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast.error(error.response?.data?.error || 'Failed to delete debt');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReturned = async (id) => {
    if (!userId) return;
    const debtToUpdate = debts.find(debt => debt.id === id);
    if (!debtToUpdate) return;

    const isCurrentlyReturned = debtToUpdate.returned || false;
    const returnDate = new Date().toISOString().split('T')[0];
    const oldReturnedDate = debtToUpdate.returnedDate;

    setLoading(true);
    try {
      // Update the debt via API
      const response = await api.patch(`/api/salary/debts/${id}/`, {
        user_id: userId,
        returned: !isCurrentlyReturned,
        returnedDate: !isCurrentlyReturned ? returnDate : null
      });
      
      // Update local state
      onSave(debts.map(debt => debt.id === id ? response.data : debt));

      const debtCurrency = debtToUpdate.currency || 'USD';
      const debtAmount = parseFloat(debtToUpdate.amount);
      
      if (!isCurrentlyReturned) {
        // If marking as returned, update or create the "Returned debts" expense entry
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Find existing "Returned debts" expense for this month and currency
        const returnedDebtsExpenseIndex = expenses.findIndex(expense => {
          const expenseDate = new Date(expense.date);
          return expense.description === 'Returned debts' &&
                 expenseDate.getMonth() === currentMonth &&
                 expenseDate.getFullYear() === currentYear &&
                 (expense.currency || 'USD') === debtCurrency;
        });
        
        if (returnedDebtsExpenseIndex !== -1) {
          // Update existing entry via API
          const existingExpense = expenses[returnedDebtsExpenseIndex];
          const updatedAmount = parseFloat(existingExpense.amount) + debtAmount;
          const updateResponse = await api.patch(`/api/salary/expenses/${existingExpense.id}/`, {
            user_id: userId,
            amount: updatedAmount
          });
          onSaveExpenses(expenses.map(exp => exp.id === existingExpense.id ? updateResponse.data : exp));
        } else {
          // Create new entry via API
          const newExpenseResponse = await api.post('/api/salary/expenses/create/', {
            user_id: userId,
            description: 'Returned debts',
            amount: debtAmount,
            date: returnDate,
            currency: debtCurrency
          });
          onSaveExpenses([...expenses, newExpenseResponse.data]);
        }
      } else {
        // If un-returning, update the "Returned debts" expense entry
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Find existing "Returned debts" expense for this month and currency
        const returnedDebtsExpenseIndex = expenses.findIndex(expense => {
          const expenseDate = new Date(expense.date);
          return expense.description === 'Returned debts' &&
                 expenseDate.getMonth() === currentMonth &&
                 expenseDate.getFullYear() === currentYear &&
                 (expense.currency || 'USD') === debtCurrency;
        });
        
        if (returnedDebtsExpenseIndex !== -1) {
          const existingExpense = expenses[returnedDebtsExpenseIndex];
          const currentAmount = parseFloat(existingExpense.amount);
          const newAmount = currentAmount - debtAmount;
          
          if (newAmount <= 0) {
            // Delete the entry via API
            await api.delete(`/api/salary/expenses/${existingExpense.id}/delete/?user_id=${userId}`);
            onSaveExpenses(expenses.filter(exp => exp.id !== existingExpense.id));
          } else {
            // Update the amount via API
            const updateResponse = await api.patch(`/api/salary/expenses/${existingExpense.id}/`, {
              user_id: userId,
              amount: newAmount
            });
            onSaveExpenses(expenses.map(exp => exp.id === existingExpense.id ? updateResponse.data : exp));
          }
        }
      }
      // Reload summary after all operations complete
      if (onReload) {
        await onReload();
      }
      toast.success(`Debt ${!isCurrentlyReturned ? 'marked as returned' : 'marked as not returned'}`);
    } catch (error) {
      console.error('Error toggling debt returned status:', error);
      toast.error(error.response?.data?.error || 'Failed to update debt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Debts (Money You Owe)</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
        >
          {showForm ? 'Cancel' : '+ Add Debt'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Person/Company (e.g., John, Bank)"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount Owed"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
            required
          />
          <select
            value={debtCurrency}
            onChange={(e) => setDebtCurrency(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
            required
          >
            {Object.values(currencies).map(curr => (
              <option key={curr.code} value={curr.code}>{curr.name} ({curr.code})</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
          />
          <button type="submit" className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition">
            Add Debt
          </button>
        </form>
      )}

      <div className="space-y-2">
        {debts.length === 0 ? (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No debts recorded</p>
        ) : (
          <>
            {debts.slice(0, DISPLAY_LIMIT).map(debt => (
            <div key={debt.id} className={`flex justify-between items-center p-3 ${debt.returned ? (darkMode ? 'bg-gray-600 opacity-60' : 'bg-gray-100 opacity-60') : (darkMode ? 'bg-gray-700' : 'bg-gray-50')} rounded-lg ${debt.returned ? 'line-through' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{debt.person}</p>
                  {debt.returned && (
                    <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-700'}`}>
                      Returned
                    </span>
                  )}
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{debt.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <p className={`text-sm font-bold ${debt.returned ? 'text-gray-500' : 'text-red-600 dark:text-red-400'}`}>
                  {(() => {
                    const curr = debt.currency || 'USD';
                    const currInfo = currencies[curr];
                    const formatted = parseFloat(debt.amount).toLocaleString(currInfo.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return curr === 'USD' ? `${currInfo.symbol}${formatted}` : `${currInfo.symbol} ${formatted}`;
                  })()}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleReturned(debt.id);
                  }}
                  className={`text-sm px-2 py-1 rounded transition ${debt.returned ? (darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300') : (darkMode ? 'bg-green-700 text-green-300 hover:bg-green-600' : 'bg-green-100 text-green-700 hover:bg-green-200')}`}
                  title={debt.returned ? 'Mark as not returned' : 'Mark as returned'}
                >
                  {debt.returned ? '↩' : '✓'}
                </button>
                <button
                  onClick={() => handleDelete(debt.id)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
            ))}
            
            {debts.length > DISPLAY_LIMIT && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllDebts(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  View All ({debts.length} total)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* View All Debts Modal */}
      {showAllDebts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowAllDebts(false)}>
          <div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                All Debts ({debts.length})
              </h3>
              <button
                onClick={() => setShowAllDebts(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {debts.map(debt => (
                <div key={debt.id} className={`flex justify-between items-center p-3 ${debt.returned ? (darkMode ? 'bg-gray-600 opacity-60' : 'bg-gray-100 opacity-60') : (darkMode ? 'bg-gray-700' : 'bg-gray-50')} rounded-lg ${debt.returned ? 'line-through' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{debt.person}</p>
                      {debt.returned && (
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-700'}`}>
                          Returned
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{debt.description}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className={`text-sm font-bold ${debt.returned ? 'text-gray-500' : 'text-red-600 dark:text-red-400'}`}>
                      {(() => {
                        const curr = debt.currency || 'USD';
                        const currInfo = currencies[curr];
                        const formatted = parseFloat(debt.amount).toLocaleString(currInfo.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        return curr === 'USD' ? `${currInfo.symbol}${formatted}` : `${currInfo.symbol} ${formatted}`;
                      })()}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleReturned(debt.id);
                      }}
                      className={`text-sm px-2 py-1 rounded transition ${debt.returned ? (darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300') : (darkMode ? 'bg-green-700 text-green-300 hover:bg-green-600' : 'bg-green-100 text-green-700 hover:bg-green-200')}`}
                      title={debt.returned ? 'Mark as not returned' : 'Mark as returned'}
                    >
                      {debt.returned ? '↩' : '✓'}
                    </button>
                    <button
                      onClick={() => {
                        handleDelete(debt.id);
                        if (debts.length === 1) setShowAllDebts(false);
                      }}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoanManager({ loans, onSave, onReload, showForm, setShowForm, darkMode, incomes, onSaveIncomes }) {
  const { currencies } = useCurrency();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loanCurrency, setLoanCurrency] = useState('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllLoans, setShowAllLoans] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const DISPLAY_LIMIT = 4;
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userInfo.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!person || !amount || !userId) return;
    
    setLoading(true);
    try {
      const response = await api.post('/api/salary/loans/create/', {
        user_id: userId,
        person,
        amount: parseFloat(amount),
        description: description || 'No description',
        currency: loanCurrency,
        date: date
      });
      onSave([...loans, response.data]);
      setPerson('');
      setAmount('');
      setDescription('');
      setLoanCurrency('USD');
      setDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      await loadData(); // Reload summary
      toast.success('Loan added successfully');
    } catch (error) {
      console.error('Error adding loan:', error);
      toast.error(error.response?.data?.error || 'Failed to add loan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!userId) return;
    setLoading(true);
    try {
      await api.delete(`/api/salary/loans/${id}/delete/?user_id=${userId}`);
      onSave(loans.filter(loan => loan.id !== id));
      await loadData(); // Reload summary
      toast.success('Loan deleted successfully');
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast.error(error.response?.data?.error || 'Failed to delete loan');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReturned = async (id) => {
    if (!userId) return;
    const loanToUpdate = loans.find(loan => loan.id === id);
    if (!loanToUpdate) return;

    const isCurrentlyReturned = loanToUpdate.returned || false;
    const returnDate = new Date().toISOString().split('T')[0];
    const oldReturnedDate = loanToUpdate.returnedDate;

    setLoading(true);
    try {
      // Update the loan via API
      const response = await api.patch(`/api/salary/loans/${id}/`, {
        user_id: userId,
        returned: !isCurrentlyReturned,
        returnedDate: !isCurrentlyReturned ? returnDate : null
      });
      
      // Update local state
      onSave(loans.map(loan => loan.id === id ? response.data : loan));

      const loanCurrency = loanToUpdate.currency || 'USD';
      const loanAmount = parseFloat(loanToUpdate.amount);
      
      // Check if the loan was made in a previous month (not current month)
      const loanDate = loanToUpdate.date ? new Date(loanToUpdate.date) : new Date(loanToUpdate.id);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const loanMonth = loanDate.getMonth();
      const loanYear = loanDate.getFullYear();
      const isFromPreviousMonth = loanMonth !== currentMonth || loanYear !== currentYear;
      
      if (!isCurrentlyReturned && isFromPreviousMonth) {
        // If marking as returned AND loan is from previous month, update or create the "Returned loans" income entry
        const returnedLoansIncomeIndex = incomes.findIndex(income => {
          const incomeDate = new Date(income.date);
          return income.description === 'Returned loans' &&
                 incomeDate.getMonth() === currentMonth &&
                 incomeDate.getFullYear() === currentYear &&
                 (income.currency || 'USD') === loanCurrency;
        });
        
        if (returnedLoansIncomeIndex !== -1) {
          // Update existing entry via API
          const existingIncome = incomes[returnedLoansIncomeIndex];
          const updatedAmount = parseFloat(existingIncome.amount) + loanAmount;
          const updateResponse = await api.patch(`/api/salary/incomes/${existingIncome.id}/`, {
            user_id: userId,
            amount: updatedAmount
          });
          onSaveIncomes(incomes.map(inc => inc.id === existingIncome.id ? updateResponse.data : inc));
        } else {
          // Create new entry via API
          const newIncomeResponse = await api.post('/api/salary/incomes/create/', {
            user_id: userId,
            description: 'Returned loans',
            amount: loanAmount,
            date: returnDate,
            currency: loanCurrency
          });
          onSaveIncomes([...incomes, newIncomeResponse.data]);
        }
      } else if (isCurrentlyReturned && isFromPreviousMonth) {
        // If un-returning AND loan is from previous month, update the "Returned loans" income entry
        const returnedLoansIncomeIndex = incomes.findIndex(income => {
          const incomeDate = new Date(income.date);
          return income.description === 'Returned loans' &&
                 incomeDate.getMonth() === currentMonth &&
                 incomeDate.getFullYear() === currentYear &&
                 (income.currency || 'USD') === loanCurrency;
        });
        
        if (returnedLoansIncomeIndex !== -1) {
          const existingIncome = incomes[returnedLoansIncomeIndex];
          const currentAmount = parseFloat(existingIncome.amount);
          const newAmount = currentAmount - loanAmount;
          
          if (newAmount <= 0) {
            // Delete the entry via API
            await api.delete(`/api/salary/incomes/${existingIncome.id}/delete/?user_id=${userId}`);
            onSaveIncomes(incomes.filter(inc => inc.id !== existingIncome.id));
          } else {
            // Update the amount via API
            const updateResponse = await api.patch(`/api/salary/incomes/${existingIncome.id}/`, {
              user_id: userId,
              amount: newAmount
            });
            onSaveIncomes(incomes.map(inc => inc.id === existingIncome.id ? updateResponse.data : inc));
          }
        }
      }
      // Reload summary after all operations complete
      if (onReload) {
        await onReload();
      }
      toast.success(`Loan ${!isCurrentlyReturned ? 'marked as returned' : 'marked as not returned'}`);
    } catch (error) {
      console.error('Error toggling loan returned status:', error);
      toast.error(error.response?.data?.error || 'Failed to update loan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Loans (Money Lent to Others)</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition"
        >
          {showForm ? 'Cancel' : '+ Add Loan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Person (e.g., Sarah, Friend)"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-amber-500`}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount Lent"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-amber-500`}
            required
          />
          <select
            value={loanCurrency}
            onChange={(e) => setLoanCurrency(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-amber-500`}
            required
          >
            {Object.values(currencies).map(curr => (
              <option key={curr.code} value={curr.code}>{curr.name} ({curr.code})</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-amber-500`}
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-amber-500`}
          />
          <button type="submit" className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition">
            Add Loan
          </button>
        </form>
      )}

      <div className="space-y-2">
        {loans.length === 0 ? (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No loans recorded</p>
        ) : (
          <>
            {loans.slice(0, DISPLAY_LIMIT).map(loan => (
            <div key={loan.id} className={`flex justify-between items-center p-3 ${loan.returned ? (darkMode ? 'bg-gray-600 opacity-60' : 'bg-gray-100 opacity-60') : (darkMode ? 'bg-gray-700' : 'bg-gray-50')} rounded-lg ${loan.returned ? 'line-through' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loan.person}</p>
                  {loan.returned && (
                    <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-700'}`}>
                      Returned
                    </span>
                  )}
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{loan.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <p className={`text-sm font-bold ${loan.returned ? 'text-gray-500' : 'text-amber-600 dark:text-amber-400'}`}>
                  {(() => {
                    const curr = loan.currency || 'USD';
                    const currInfo = currencies[curr];
                    const formatted = parseFloat(loan.amount).toLocaleString(currInfo.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    return curr === 'USD' ? `${currInfo.symbol}${formatted}` : `${currInfo.symbol} ${formatted}`;
                  })()}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleReturned(loan.id);
                  }}
                  className={`text-sm px-2 py-1 rounded transition ${loan.returned ? (darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300') : (darkMode ? 'bg-green-700 text-green-300 hover:bg-green-600' : 'bg-green-100 text-green-700 hover:bg-green-200')}`}
                  title={loan.returned ? 'Mark as not returned' : 'Mark as returned'}
                >
                  {loan.returned ? '↩' : '✓'}
                </button>
                <button
                  onClick={() => handleDelete(loan.id)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
            ))}
            
            {loans.length > DISPLAY_LIMIT && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAllLoans(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  View All ({loans.length} total)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* View All Loans Modal */}
      {showAllLoans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={() => setShowAllLoans(false)}>
          <div 
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                All Loans ({loans.length})
              </h3>
              <button
                onClick={() => setShowAllLoans(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {loans.map(loan => (
                <div key={loan.id} className={`flex justify-between items-center p-3 ${loan.returned ? (darkMode ? 'bg-gray-600 opacity-60' : 'bg-gray-100 opacity-60') : (darkMode ? 'bg-gray-700' : 'bg-gray-50')} rounded-lg ${loan.returned ? 'line-through' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loan.person}</p>
                      {loan.returned && (
                        <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-700'}`}>
                          Returned
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{loan.description}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className={`text-sm font-bold ${loan.returned ? 'text-gray-500' : 'text-amber-600 dark:text-amber-400'}`}>
                      {(() => {
                        const curr = loan.currency || 'USD';
                        const currInfo = currencies[curr];
                        const formatted = parseFloat(loan.amount).toLocaleString(currInfo.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        return curr === 'USD' ? `${currInfo.symbol}${formatted}` : `${currInfo.symbol} ${formatted}`;
                      })()}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleReturned(loan.id);
                      }}
                      className={`text-sm px-2 py-1 rounded transition ${loan.returned ? (darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300') : (darkMode ? 'bg-green-700 text-green-300 hover:bg-green-600' : 'bg-green-100 text-green-700 hover:bg-green-200')}`}
                      title={loan.returned ? 'Mark as not returned' : 'Mark as returned'}
                    >
                      {loan.returned ? '↩' : '✓'}
                    </button>
                    <button
                      onClick={() => {
                        handleDelete(loan.id);
                        if (loans.length === 1) setShowAllLoans(false);
                      }}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SavingsManager({ savings, summary, onSave, showForm, setShowForm, darkMode }) {
  const { formatCurrency } = useCurrency();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userInfo.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !userId) return;
    setLoading(true);
    try {
      await onSave(parseFloat(amount));
      setAmount('');
      setShowForm(false);
      toast.success('Savings updated successfully');
    } catch (error) {
      console.error('Error updating savings:', error);
      toast.error(error.response?.data?.error || 'Failed to update savings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Savings</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition"
        >
          {showForm ? 'Cancel' : 'Update Savings'}
        </button>
      </div>

      <div className="mb-4">
        <p className={`text-2xl font-bold text-indigo-600 dark:text-indigo-400`}>
          {formatCurrency(summary?.savings || 0, false).display}
        </p>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Current savings balance</p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
          <input
            type="number"
            step="0.01"
            placeholder="Total Savings Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            required
          />
          <button type="submit" className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition">
            Update Savings
          </button>
        </form>
      )}
    </div>
  );
}

