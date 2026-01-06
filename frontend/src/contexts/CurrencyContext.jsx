import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' }
};

// Default exchange rates - only USD supported
const DEFAULT_EXCHANGE_RATES = {
  USD: { buy: 1, sell: 1 }
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    // Always use USD since we only support USD now
    // Clear any old currency values from localStorage
    const saved = localStorage.getItem('currency');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed !== 'USD') {
          localStorage.setItem('currency', JSON.stringify('USD'));
        }
      } catch (e) {
        localStorage.setItem('currency', JSON.stringify('USD'));
      }
    } else {
      localStorage.setItem('currency', JSON.stringify('USD'));
    }
    return 'USD';
  });

  const [exchangeRates, setExchangeRates] = useState(() => {
    return DEFAULT_EXCHANGE_RATES;
  });

  useEffect(() => {
    localStorage.setItem('currency', JSON.stringify(currency));
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  const updateExchangeRate = (currencyCode, type, rate) => {
    setExchangeRates(prev => ({
      ...prev,
      [currencyCode]: {
        ...prev[currencyCode],
        [type]: parseFloat(rate) || 0
      }
    }));
  };

  const formatCurrency = (amount, assumeUSD = true) => {
    const currencyInfo = CURRENCIES.USD;
    
    // Always USD, no conversion needed
    const formatted = amount.toLocaleString(currencyInfo.locale, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    
    return {
      formatted: formatted,
      symbol: currencyInfo.symbol,
      code: currencyInfo.code,
      display: `${currencyInfo.symbol}${formatted}`
    };
  };

  const convertAmount = (amount, useSellRate = false) => {
    // Always USD, no conversion needed
    return amount;
  };

  // Convert amount from one currency to another (always USD)
  const convertBetweenCurrencies = (amount, fromCurrency, toCurrency, useSellRate = false) => {
    // Always USD, no conversion needed
    return amount;
  };

  // Format currency with original currency info (always USD)
  const formatCurrencyWithOriginal = (amount, originalCurrency) => {
    const currencyInfo = CURRENCIES.USD;
    
    const formatted = amount.toLocaleString(currencyInfo.locale, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    
    return {
      formatted: formatted,
      symbol: currencyInfo.symbol,
      code: currencyInfo.code,
      display: `${currencyInfo.symbol}${formatted}`,
      originalCurrency: 'USD'
    };
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      currencies: CURRENCIES,
      exchangeRates,
      updateExchangeRate,
      formatCurrency,
      formatCurrencyWithOriginal,
      convertAmount,
      convertBetweenCurrencies
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

