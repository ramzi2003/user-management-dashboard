import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  KGS: { code: 'KGS', symbol: 'KGS', name: 'Kyrgyz Som', locale: 'ru-KG' },
  TJS: { code: 'TJS', symbol: 'TJS', name: 'Tajik Somoni', locale: 'ru-TJ' }
};

// Default exchange rates (approximate - you can update these with real-time rates)
// Structure: { currency: { buy: rate, sell: rate } }
const DEFAULT_EXCHANGE_RATES = {
  USD: { buy: 1, sell: 1 },
  KGS: { buy: 89.5, sell: 90.0 }, // 1 USD = ~89.5 KGS (buy), 1 USD = ~90.0 KGS (sell)
  TJS: { buy: 10.9, sell: 11.0 }   // 1 USD = ~10.9 TJS (buy), 1 USD = ~11.0 TJS (sell)
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('currency');
    return saved ? JSON.parse(saved) : 'USD';
  });

  const [exchangeRates, setExchangeRates] = useState(() => {
    const saved = localStorage.getItem('exchangeRates');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old format to new format if needed
      if (parsed.USD && typeof parsed.USD === 'number') {
        return {
          USD: { buy: 1, sell: 1 },
          KGS: { buy: parsed.KGS || 89.5, sell: parsed.KGS ? parsed.KGS * 1.005 : 90.0 },
          TJS: { buy: parsed.TJS || 10.9, sell: parsed.TJS ? parsed.TJS * 1.005 : 11.0 }
        };
      }
      return parsed;
    }
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
    const currencyInfo = CURRENCIES[currency];
    
    let convertedAmount;
    if (assumeUSD) {
      // Use buy rate for converting from USD to other currencies
      const exchangeRate = exchangeRates[currency].buy;
      convertedAmount = amount * exchangeRate;
    } else {
      // Amount is already in the selected currency, no conversion needed
      convertedAmount = amount;
    }
    
    const formatted = convertedAmount.toLocaleString(currencyInfo.locale, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    
    // USD: $100 (symbol before, no space)
    // TJS and KGS: TJS 100 (symbol, space, number)
    if (currency === 'USD') {
      return {
        formatted: formatted,
        symbol: currencyInfo.symbol,
        code: currencyInfo.code,
        display: `${currencyInfo.symbol}${formatted}`
      };
    } else {
      return {
        formatted: formatted,
        symbol: currencyInfo.symbol,
        code: currencyInfo.code,
        display: `${currencyInfo.symbol} ${formatted}`
      };
    }
  };

  const convertAmount = (amount, useSellRate = false) => {
    const rate = useSellRate ? exchangeRates[currency].sell : exchangeRates[currency].buy;
    return amount * rate;
  };

  // Convert amount from one currency to another
  const convertBetweenCurrencies = (amount, fromCurrency, toCurrency, useSellRate = false) => {
    if (fromCurrency === toCurrency) return amount;
    
    // First convert to USD (using sell rate if selling the fromCurrency)
    let amountInUSD;
    if (fromCurrency === 'USD') {
      amountInUSD = amount;
    } else {
      // Selling fromCurrency to get USD
      amountInUSD = amount / exchangeRates[fromCurrency].sell;
    }
    
    // Then convert from USD to toCurrency (using buy rate if buying toCurrency)
    if (toCurrency === 'USD') {
      return amountInUSD;
    } else {
      // Buying toCurrency with USD
      return amountInUSD * exchangeRates[toCurrency].buy;
    }
  };

  // Format currency with original currency info
  const formatCurrencyWithOriginal = (amount, originalCurrency) => {
    const convertedAmount = convertBetweenCurrencies(amount, originalCurrency, currency);
    const currencyInfo = CURRENCIES[currency];
    
    const formatted = convertedAmount.toLocaleString(currencyInfo.locale, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    
    // USD: $100 (symbol before, no space)
    // TJS and KGS: TJS 100 (symbol, space, number)
    let display;
    if (currency === 'USD') {
      display = `${currencyInfo.symbol}${formatted}`;
    } else {
      display = `${currencyInfo.symbol} ${formatted}`;
    }
    
    // Show original currency if different
    if (originalCurrency !== currency) {
      const originalInfo = CURRENCIES[originalCurrency];
      const originalFormatted = amount.toLocaleString(originalInfo.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      let originalDisplay;
      if (originalCurrency === 'USD') {
        originalDisplay = `${originalInfo.symbol}${originalFormatted}`;
      } else {
        originalDisplay = `${originalInfo.symbol} ${originalFormatted}`;
      }
      display += ` (${originalDisplay})`;
    }
    
    return {
      formatted: formatted,
      symbol: currencyInfo.symbol,
      code: currencyInfo.code,
      display: display,
      originalCurrency: originalCurrency
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

