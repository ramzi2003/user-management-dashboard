import { useState, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

export default function SalarySection({ darkMode }) {
  const { formatCurrency, convertBetweenCurrencies, currencies, currency: selectedCurrency } = useCurrency();
  const [incomes, setIncomes] = useState(() => {
    const saved = localStorage.getItem('salary_incomes');
    const parsed = saved ? JSON.parse(saved) : [];
    // Migrate old entries without currency to have USD
    return parsed.map(inc => ({
      ...inc,
      currency: inc.currency || 'USD'
    }));
  });
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('salary_expenses');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map(exp => ({
      ...exp,
      currency: exp.currency || 'USD'
    }));
  });
  const [debts, setDebts] = useState(() => {
    const saved = localStorage.getItem('salary_debts');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map(debt => ({
      ...debt,
      currency: debt.currency || 'USD',
      returned: debt.returned || false
    }));
  });
  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('salary_loans');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.map(loan => ({
      ...loan,
      currency: loan.currency || 'USD',
      returned: loan.returned || false
    }));
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

  // Monthly rollover logic
  useEffect(() => {
    const checkMonthlyRollover = () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentDay = now.getDate();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Get last processed month from localStorage
      let lastProcessedMonth = localStorage.getItem('last_processed_month');
      let lastProcessedYear = localStorage.getItem('last_processed_year');
      
      // Initialize if first time
      if (lastProcessedMonth === null || lastProcessedYear === null) {
        localStorage.setItem('last_processed_month', currentMonth.toString());
        localStorage.setItem('last_processed_year', currentYear.toString());
        return; // Don't process anything on first run
      }
      
      // Get the last day of the current month
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // Check if we're at the end of the month (last day, 23:59)
      const isEndOfMonth = currentDay === lastDayOfMonth && currentHour === 23 && currentMinute >= 59;
      
      // Check if we're in a new month that hasn't been processed yet
      const isNewMonth = parseInt(lastProcessedMonth) !== currentMonth || parseInt(lastProcessedYear) !== currentYear;
      
      // If we're in a new month, first save the previous month's snapshot (if not already saved)
      if (isNewMonth) {
        const prevMonth = parseInt(lastProcessedMonth);
        const prevYear = parseInt(lastProcessedYear);
        
        // Get current data from localStorage (to avoid stale state)
        const currentIncomes = JSON.parse(localStorage.getItem('salary_incomes') || '[]');
        const currentExpenses = JSON.parse(localStorage.getItem('salary_expenses') || '[]');
        const currentDebts = JSON.parse(localStorage.getItem('salary_debts') || '[]');
        const currentLoans = JSON.parse(localStorage.getItem('salary_loans') || '[]');
        const currentSavings = parseFloat(localStorage.getItem('salary_savings') || '0');
        
        // Check if previous month was already saved
        const existingHistory = localStorage.getItem('monthly_history');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        const prevMonthSaved = history.some(snapshot => snapshot.month === prevMonth && snapshot.year === prevYear);
        
        // If previous month wasn't saved, save it now
        if (!prevMonthSaved && (currentIncomes.length > 0 || currentExpenses.length > 0)) {
          // Calculate totals for previous month
          const prevMonthlyIncome = currentIncomes
    .filter(inc => {
      const date = new Date(inc.date);
              return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
            })
            .reduce((sum, inc) => {
              const amountInUSD = convertBetweenCurrencies(parseFloat(inc.amount || 0), inc.currency || 'USD', 'USD');
              return sum + amountInUSD;
            }, 0);
          
          const prevTotalExpenses = currentExpenses
            .filter(exp => {
              const date = new Date(exp.date);
              return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
            })
            .reduce((sum, exp) => {
              const amountInUSD = convertBetweenCurrencies(parseFloat(exp.amount || 0), exp.currency || 'USD', 'USD');
              return sum + amountInUSD;
            }, 0) + currentSavings;
          
          const prevTotalDebts = currentDebts
            .filter(debt => !debt.returned)
            .reduce((sum, debt) => {
              const amountInUSD = convertBetweenCurrencies(parseFloat(debt.amount || 0), debt.currency || 'USD', 'USD');
              return sum + amountInUSD;
            }, 0);
          
          const prevTotalLoans = currentLoans
            .filter(loan => !loan.returned)
            .reduce((sum, loan) => {
              const amountInUSD = convertBetweenCurrencies(parseFloat(loan.amount || 0), loan.currency || 'USD', 'USD');
              return sum + amountInUSD;
            }, 0);
          
          const monthSnapshot = {
            year: prevYear,
            month: prevMonth,
            monthName: new Date(prevYear, prevMonth).toLocaleString('default', { month: 'long' }),
            timestamp: new Date(prevYear, prevMonth + 1, 0, 23, 59, 59).toISOString(),
            incomes: currentIncomes,
            expenses: currentExpenses,
            debts: currentDebts,
            loans: currentLoans,
            savings: currentSavings,
            monthlyIncome: prevMonthlyIncome,
            totalExpenses: prevTotalExpenses,
            totalDebts: prevTotalDebts,
            totalLoans: prevTotalLoans,
          };
          
          history.push(monthSnapshot);
          
          // Keep only last 12 months
          if (history.length > 12) {
            history.shift();
          }
          
          localStorage.setItem('monthly_history', JSON.stringify(history));
        }
        
        // Clear income and expenses for the new month (keep savings, unreturned debts/loans)
        // Only clear if we haven't already cleared (check if arrays are empty)
        const savedIncomes = JSON.parse(localStorage.getItem('salary_incomes') || '[]');
        const savedExpenses = JSON.parse(localStorage.getItem('salary_expenses') || '[]');
        
        // Only clear if there's data to clear (avoid clearing repeatedly)
        if (savedIncomes.length > 0 || savedExpenses.length > 0) {
          setIncomes([]);
          setExpenses([]);
          localStorage.setItem('salary_incomes', JSON.stringify([]));
          localStorage.setItem('salary_expenses', JSON.stringify([]));
        }
        
        // Mark this month as processed immediately to prevent repeated clearing
        localStorage.setItem('last_processed_month', currentMonth.toString());
        localStorage.setItem('last_processed_year', currentYear.toString());
      }
      
      // If it's the end of the current month, save snapshot
      if (isEndOfMonth) {
        // Get current data from localStorage
        const currentIncomes = JSON.parse(localStorage.getItem('salary_incomes') || '[]');
        const currentExpenses = JSON.parse(localStorage.getItem('salary_expenses') || '[]');
        const currentDebts = JSON.parse(localStorage.getItem('salary_debts') || '[]');
        const currentLoans = JSON.parse(localStorage.getItem('salary_loans') || '[]');
        const currentSavings = parseFloat(localStorage.getItem('salary_savings') || '0');
        
        const monthSnapshot = {
          year: currentYear,
          month: currentMonth,
          monthName: now.toLocaleString('default', { month: 'long' }),
          timestamp: now.toISOString(),
          incomes: currentIncomes,
          expenses: currentExpenses,
          debts: currentDebts,
          loans: currentLoans,
          savings: currentSavings,
          monthlyIncome: currentIncomes
            .filter(inc => {
              const date = new Date(inc.date);
              return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, inc) => {
              const amountInUSD = convertBetweenCurrencies(parseFloat(inc.amount || 0), inc.currency || 'USD', 'USD');
              return sum + amountInUSD;
            }, 0),
          totalExpenses: currentExpenses
    .filter(exp => {
      const date = new Date(exp.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
            .reduce((sum, exp) => {
              const amountInUSD = convertBetweenCurrencies(parseFloat(exp.amount || 0), exp.currency || 'USD', 'USD');
              return sum + amountInUSD;
            }, 0) + currentSavings,
          totalDebts: currentDebts
            .filter(debt => !debt.returned)
            .reduce((sum, debt) => {
              const amountInUSD = convertBetweenCurrencies(parseFloat(debt.amount || 0), debt.currency || 'USD', 'USD');
              return sum + amountInUSD;
            }, 0),
          totalLoans: currentLoans
            .filter(loan => !loan.returned)
            .reduce((sum, loan) => {
              const amountInUSD = convertBetweenCurrencies(parseFloat(loan.amount || 0), loan.currency || 'USD', 'USD');
              return sum + amountInUSD;
            }, 0),
        };
        
        // Get existing history
        const existingHistory = localStorage.getItem('monthly_history');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        
        // Check if this month is already saved
        const alreadySaved = history.some(snapshot => snapshot.month === currentMonth && snapshot.year === currentYear);
        if (!alreadySaved) {
          // Add new snapshot
          history.push(monthSnapshot);
          
          // Keep only last 12 months
          if (history.length > 12) {
            history.shift();
          }
          
          // Save history
          localStorage.setItem('monthly_history', JSON.stringify(history));
        }
        
        // Mark this month as processed
        localStorage.setItem('last_processed_month', currentMonth.toString());
        localStorage.setItem('last_processed_year', currentYear.toString());
      }
    };
    
    // Check immediately on mount
    checkMonthlyRollover();
    
    // Check every minute
    const interval = setInterval(checkMonthlyRollover, 60000);
    
    return () => clearInterval(interval);
  }, [convertBetweenCurrencies]); // Only depend on convertBetweenCurrencies, not on state values

  // Helper function to calculate total efficiently
  // Returns { amount: number in selected currency, isDirectSum: boolean }
  const calculateTotal = (items, filterFn = () => true) => {
    const filtered = items.filter(filterFn);
    if (filtered.length === 0) return { amount: 0, isDirectSum: false };
    
    // Check if all items are in the same currency
    const currencies = [...new Set(filtered.map(item => item.currency || 'USD'))];
    const allSameCurrency = currencies.length === 1;
    
    // If all items are in the selected currency, sum directly
    if (allSameCurrency && currencies[0] === selectedCurrency) {
      const total = filtered.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      return { amount: total, isDirectSum: true };
    }
    
    // Otherwise, convert to USD first, then to selected currency
    const totalInUSD = filtered.reduce((sum, item) => {
      const amountInUSD = convertBetweenCurrencies(parseFloat(item.amount || 0), item.currency || 'USD', 'USD');
      return sum + amountInUSD;
    }, 0);
    
    // Convert from USD to selected currency
    const totalInSelected = convertBetweenCurrencies(totalInUSD, 'USD', selectedCurrency);
    return { amount: totalInSelected, isDirectSum: false };
  };

  // Calculate totals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Calculate monthly income
  const monthlyIncomeResult = calculateTotal(incomes, (inc) => {
    const date = new Date(inc.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const monthlyIncome = monthlyIncomeResult.amount;
  const monthlyIncomeIsDirect = monthlyIncomeResult.isDirectSum;

  // Calculate yearly income
  const yearlyIncomeResult = calculateTotal(incomes, (inc) => {
    return new Date(inc.date).getFullYear() === currentYear;
  });
  const yearlyIncome = yearlyIncomeResult.amount;
  const yearlyIncomeIsDirect = yearlyIncomeResult.isDirectSum;

  // Calculate total expenses
  const totalExpensesResult = calculateTotal(expenses, (exp) => {
    const date = new Date(exp.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  // Add savings (convert to selected currency if needed)
  // Savings is stored in USD, convert to selected currency
  const savingsInSelected = convertBetweenCurrencies(savings, 'USD', selectedCurrency);
  const totalExpenses = totalExpensesResult.amount + savingsInSelected;
  // Expenses are mixed if savings is added (savings is always in USD)
  const totalExpensesIsDirect = totalExpensesResult.isDirectSum && savings === 0;

  // Helper function to get date from debt/loan (use date field if exists, otherwise infer from id)
  const getDebtLoanDate = (item) => {
    if (item.date) {
      return new Date(item.date);
    }
    // For backward compatibility: use id timestamp to infer date
    // id is Date.now(), so convert to date
    return new Date(item.id);
  };

  // Calculate total debts and loans for display (all non-returned)
  const allDebtsResult = calculateTotal(debts.filter(debt => !debt.returned));
  const allDebts = allDebtsResult.amount;
  const allDebtsIsDirect = allDebtsResult.isDirectSum;
  
  const allLoansResult = calculateTotal(loans.filter(loan => !loan.returned));
  const allLoans = allLoansResult.amount;
  const allLoansIsDirect = allLoansResult.isDirectSum;

  // Helper function to check if returned in current month
  const isReturnedInCurrentMonth = (item) => {
    if (!item.returned || !item.returnedDate) return false;
    const returnedDate = new Date(item.returnedDate);
    return returnedDate.getMonth() === currentMonth && returnedDate.getFullYear() === currentYear;
  };

  // For Available Money calculation:
  // - Debts from previous months that are NOT returned: Don't count (already accounted for in previous month)
  // - Debts from current month that are NOT returned: ADD (you have this money)
  // - Debts returned in current month: SUBTRACT (they paid it back, so you no longer have it)
  const nonReturnedDebts = debts.filter(debt => {
    const debtDate = getDebtLoanDate(debt);
    const isFromCurrentMonth = debtDate.getMonth() === currentMonth && debtDate.getFullYear() === currentYear;
    return isFromCurrentMonth && !debt.returned;
  });
  const returnedDebts = debts.filter(debt => isReturnedInCurrentMonth(debt));
  
  const nonReturnedDebtsResult = calculateTotal(nonReturnedDebts);
  const returnedDebtsResult = calculateTotal(returnedDebts);
  
  // Loans: money you lent (you don't have this money, so it subtracts from available money)
  // - Loans from previous months that are NOT returned: Don't count (already accounted for in previous month)
  // - Loans from current month that are NOT returned: SUBTRACT (you don't have this money)
  // - Loans returned in current month: ADD (you got the money back)
  const nonReturnedLoans = loans.filter(loan => {
    const loanDate = getDebtLoanDate(loan);
    const isFromCurrentMonth = loanDate.getMonth() === currentMonth && loanDate.getFullYear() === currentYear;
    return isFromCurrentMonth && !loan.returned;
  });
  const returnedLoans = loans.filter(loan => isReturnedInCurrentMonth(loan));
  
  const nonReturnedLoansResult = calculateTotal(nonReturnedLoans);
  const returnedLoansResult = calculateTotal(returnedLoans);
  
  // Available Money = Income - Expenses + Debts (current month, not returned) - Debts (returned this month) - Loans (current month, not returned) + Loans (returned this month)
  const netSavings = monthlyIncome - totalExpenses + nonReturnedDebtsResult.amount - returnedDebtsResult.amount - nonReturnedLoansResult.amount + returnedLoansResult.amount;

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
      <div className="grid md:grid-cols-5 gap-6">
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Monthly Income</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyIncome, !monthlyIncomeIsDirect).display}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>This month</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>YTD Income</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(yearlyIncome, !yearlyIncomeIsDirect).display}</p>
          <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-2`}>Year to date</p>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2`}>Saved Money</p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(savings).display}</p>
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
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(allDebts, !allDebtsIsDirect).display}</p>
          </div>
        </div>
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border transition-colors duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Total Loans (Lent)</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(allLoans, !allLoansIsDirect).display}</p>
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
  const { currencies } = useCurrency();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeCurrency, setIncomeCurrency] = useState('USD');
  const [showAllIncomes, setShowAllIncomes] = useState(false);
  
  const DISPLAY_LIMIT = 4;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !amount || !date) return;
    
    const newIncome = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      date,
      currency: incomeCurrency
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description || !amount || !date) return;
    
    const newExpense = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      date,
      currency: expenseCurrency
    };
    onSave([...expenses, newExpense]);
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setExpenseCurrency('USD');
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

function DebtManager({ debts, onSave, expenses, onSaveExpenses, showForm, setShowForm, darkMode }) {
  const { currencies } = useCurrency();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [debtCurrency, setDebtCurrency] = useState('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllDebts, setShowAllDebts] = useState(false);
  
  const DISPLAY_LIMIT = 4;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!person || !amount) return;
    
    const newDebt = {
      id: Date.now(),
      person,
      amount: parseFloat(amount),
      description: description || 'No description',
      currency: debtCurrency,
      date: date
    };
    onSave([...debts, newDebt]);
    setPerson('');
    setAmount('');
    setDescription('');
    setDebtCurrency('USD');
    setDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    onSave(debts.filter(debt => debt.id !== id));
  };

  const handleToggleReturned = (id) => {
    const debtToUpdate = debts.find(debt => debt.id === id);
    if (!debtToUpdate) return;

    const isCurrentlyReturned = debtToUpdate.returned || false;
    const returnDate = new Date().toISOString().split('T')[0];

    // Update the debt
    onSave(debts.map(debt => {
      if (debt.id === id) {
        return {
          ...debt,
          returned: !isCurrentlyReturned,
          returnedDate: !isCurrentlyReturned ? returnDate : null
        };
      }
      return debt;
    }));

    // If marking as returned (not un-returning), add an expense
    if (!isCurrentlyReturned) {
      const newExpense = {
        id: Date.now(),
        description: `Returned debt - ${debtToUpdate.person}`,
        amount: debtToUpdate.amount,
        date: returnDate,
        currency: debtToUpdate.currency || 'USD'
      };
      onSaveExpenses([...expenses, newExpense]);
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

function LoanManager({ loans, onSave, showForm, setShowForm, darkMode }) {
  const { currencies } = useCurrency();
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loanCurrency, setLoanCurrency] = useState('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllLoans, setShowAllLoans] = useState(false);
  
  const DISPLAY_LIMIT = 4;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!person || !amount) return;
    
    const newLoan = {
      id: Date.now(),
      person,
      amount: parseFloat(amount),
      description: description || 'No description',
      currency: loanCurrency,
      date: date
    };
    onSave([...loans, newLoan]);
    setPerson('');
    setAmount('');
    setDescription('');
    setLoanCurrency('USD');
    setDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    onSave(loans.filter(loan => loan.id !== id));
  };

  const handleToggleReturned = (id) => {
    onSave(loans.map(loan => {
      if (loan.id === id) {
        const isCurrentlyReturned = loan.returned || false;
        return {
          ...loan,
          returned: !isCurrentlyReturned,
          returnedDate: !isCurrentlyReturned ? new Date().toISOString().split('T')[0] : null
        };
      }
      return loan;
    }));
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

function SavingsManager({ savings, onSave, showForm, setShowForm, darkMode }) {
  const { formatCurrency } = useCurrency();
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
          {formatCurrency(savings).display}
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

