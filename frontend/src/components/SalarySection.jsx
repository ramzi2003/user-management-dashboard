import { useState } from 'react';

export default function SalarySection({ darkMode }) {
  const [incomes, setIncomes] = useState(() => {
    const saved = localStorage.getItem('salary_incomes');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('salary_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [debts, setDebts] = useState(() => {
    const saved = localStorage.getItem('salary_debts');
    return saved ? JSON.parse(saved) : [];
  });
  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('salary_loans');
    return saved ? JSON.parse(saved) : [];
  });
  const [savings, setSavings] = useState(() => {
    const saved = localStorage.getItem('salary_savings');
    return saved ? parseFloat(saved) : 0;
  });

  // Form states
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showSavingsForm, setShowSavingsForm] = useState(false);

  // Calculate totals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyIncome = incomes
    .filter(inc => {
      const date = new Date(inc.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

  const yearlyIncome = incomes
    .filter(inc => new Date(inc.date).getFullYear() === currentYear)
    .reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

  const totalExpenses = expenses
    .filter(exp => {
      const date = new Date(exp.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

  const totalDebts = debts.reduce((sum, debt) => sum + parseFloat(debt.amount || 0), 0);
  const totalLoans = loans.reduce((sum, loan) => sum + parseFloat(loan.amount || 0), 0);
  const netSavings = monthlyIncome - totalExpenses + savings;

  // Save to localStorage
  const saveIncomes = (newIncomes) => {
    setIncomes(newIncomes);
    localStorage.setItem('salary_incomes', JSON.stringify(newIncomes));
  };

  const saveExpenses = (newExpenses) => {
    setExpenses(newExpenses);
    localStorage.setItem('salary_expenses', JSON.stringify(newExpenses));
  };

  const saveDebts = (newDebts) => {
    setDebts(newDebts);
    localStorage.setItem('salary_debts', JSON.stringify(newDebts));
  };

  const saveLoans = (newLoans) => {
    setLoans(newLoans);
    localStorage.setItem('salary_loans', JSON.stringify(newLoans));
  };

  const saveSavings = (newSavings) => {
    setSavings(newSavings);
    localStorage.setItem('salary_savings', newSavings.toString());
  };

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Salary & Income</h1>
      
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Monthly Income</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>This month</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>YTD Income</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">${yearlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>Year to date</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Total Savings</p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>Net savings</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Monthly Expenses</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>This month</p>
        </div>
      </div>

      {/* Debts and Loans Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Total Debts (Owed)</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">${totalDebts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Total Loans (Lent)</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">${totalLoans.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
        showForm={showDebtForm} 
        setShowForm={setShowDebtForm}
        darkMode={darkMode} 
      />

      {/* Loans Section */}
      <LoanManager 
        loans={loans} 
        onSave={saveLoans} 
        showForm={showLoanForm} 
        setShowForm={setShowLoanForm}
        darkMode={darkMode} 
      />

      {/* Savings Section */}
      <SavingsManager 
        savings={savings} 
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
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !amount || !date) return;
    
    const newIncome = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      date
    };
    onSave([...incomes, newIncome]);
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    onSave(incomes.filter(inc => inc.id !== id));
  };

  const currentMonthIncomes = incomes.filter(inc => {
    const incDate = new Date(inc.date);
    const now = new Date();
    return incDate.getMonth() === now.getMonth() && incDate.getFullYear() === now.getFullYear();
  });

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Income This Month</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition"
        >
          {showForm ? 'Cancel' : '+ Add Income'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
          <input
            type="text"
            placeholder="Description (e.g., Salary, Freelance)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            required
          />
          <button type="submit" className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition">
            Add Income
          </button>
        </form>
      )}

      <div className="space-y-2">
        {currentMonthIncomes.length === 0 ? (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No income entries this month</p>
        ) : (
          currentMonthIncomes.map(income => (
            <div key={income.id} className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{income.description}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(income.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(income.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <button
                  onClick={() => handleDelete(income.id)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExpenseManager({ expenses, onSave, showForm, setShowForm, darkMode }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !amount || !date) return;
    
    const newExpense = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      date
    };
    onSave([...expenses, newExpense]);
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    onSave(expenses.filter(exp => exp.id !== id));
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
          currentMonthExpenses.map(expense => (
            <div key={expense.id} className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{expense.description}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(expense.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-3">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">${parseFloat(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DebtManager({ debts, onSave, showForm, setShowForm, darkMode }) {
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!person || !amount) return;
    
    const newDebt = {
      id: Date.now(),
      person,
      amount: parseFloat(amount),
      description: description || 'No description'
    };
    onSave([...debts, newDebt]);
    setPerson('');
    setAmount('');
    setDescription('');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    onSave(debts.filter(debt => debt.id !== id));
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
          debts.map(debt => (
            <div key={debt.id} className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{debt.person}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{debt.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">${parseFloat(debt.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <button
                  onClick={() => handleDelete(debt.id)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LoanManager({ loans, onSave, showForm, setShowForm, darkMode }) {
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!person || !amount) return;
    
    const newLoan = {
      id: Date.now(),
      person,
      amount: parseFloat(amount),
      description: description || 'No description'
    };
    onSave([...loans, newLoan]);
    setPerson('');
    setAmount('');
    setDescription('');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    onSave(loans.filter(loan => loan.id !== id));
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
          loans.map(loan => (
            <div key={loan.id} className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loan.person}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{loan.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">${parseFloat(loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <button
                  onClick={() => handleDelete(loan.id)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SavingsManager({ savings, onSave, showForm, setShowForm, darkMode }) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    onSave(parseFloat(amount));
    setAmount('');
    setShowForm(false);
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
          ${savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

