// API service functions for backend endpoints
import api from '../api/axios';

// Stock Lists API
export const stockListsAPI = {
  // Get all stock lists
  getAll: () => api.get('/stocklists'),
  
  // Get a specific stock list
  getById: (id) => api.get(`/stocklists/${id}`),
  
  // Create a new stock list
  create: (name) => api.post('/stocklists', { name }),
  
  // Update a stock list
  update: (id, name) => api.put(`/stocklists/${id}`, { name }),
  
  // Delete a stock list
  delete: (id) => api.delete(`/stocklists/${id}`),
  
  // Add stock to list (single or bulk)
  addStock: (listId, symbol) => api.post(`/stocklists/${listId}/stocks`, { symbol }),
  
  // Add multiple stocks to list (bulk)
  addStocksBulk: (listId, symbols) => api.post(`/stocklists/${listId}/stocks`, { symbols }),
  
  // Remove stock from list
  removeStock: (listId, symbol) => api.delete(`/stocklists/${listId}/stocks/${symbol}`),
};

// Algorithm Runner API
export const algorithmAPI = {
  // Run algorithm on a single symbol
  runOnSymbol: (symbol, algoName, algoParams = {}, persist = false) =>
    api.post('/run/symbol', {
      symbol,
      algo_name: algoName,
      algo_params: algoParams,
      persist,
    }),
  
  // Run algorithm on a stock list
  runOnList: (listId, algoName, algoParams = {}, persist = false) =>
    api.post(`/run/list/${listId}`, {
      algo_name: algoName,
      algo_params: algoParams,
      persist,
    }),
  
  // Backtest algorithm on a single symbol
  backtestOnSymbol: (symbol, algoName, algoParams = {}) =>
    api.post('/backtest/symbol', {
      symbol,
      algo_name: algoName,
      algo_params: algoParams,
    }),
  
  // Backtest algorithm on a stock list
  backtestOnList: (listId, algoName, algoParams = {}) =>
    api.post(`/backtest/list/${listId}`, {
      algo_name: algoName,
      algo_params: algoParams,
    }),
};

// Fundamentals API
export const fundamentalsAPI = {
  getBySymbol: (symbol) =>
    api.get('/fundamentals/stock', {
      params: { symbol },
    }),
};

// Algorithm information
// Each algorithm can have different parameter types:
// - type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea' | 'date' | 'datetime-local' | 'email' | 'url' | 'range'
// - label: Display label for the parameter
// - description: Optional description/tooltip
// - default: Default value
// - options: Array of options (required for 'select' type)
// - min, max, step: For 'number' and 'range' types
// - placeholder: Placeholder text
// - required: Boolean indicating if field is required
// - disabled: Boolean indicating if field is disabled
export const algorithms = {
  v20: {
    name: 'v20',
    displayName: 'V20 Algorithm',
    description: 'Identifies green candle sequences and finds periods where stocks increase by a target percentage (default 20%) within consecutive green candles.',
    run: true,
    backtest: true,
    parameters: {
      period: {
        label: 'Period',
        type: 'select',
        default: '6mo',
        options: ['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'],
        description: 'Time period for data analysis',
      },
      interval: {
        label: 'Interval',
        type: 'select',
        default: '1d',
        options: ['1d', '1wk', '1mo'],
        description: 'Candle interval',
      },
      target_increase: {
        label: 'Target Increase (%)',
        type: 'number',
        default: 20,
        description: 'Minimum percentage increase to detect',
      },
    },
  },
  v20extra: {
    name: 'v20extra',
    displayName: 'V20 Extra Algorithm',
    description: 'Enhanced version of v20 that includes SMA-200 filter. Only signals where the low price is below the 200-day moving average are included.',
    run: true,
    backtest: true,
    parameters: {
      period: {
        label: 'Period',
        type: 'select',
        default: '6mo',
        options: ['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'],
        description: 'Time period for data analysis',
      },
      interval: {
        label: 'Interval',
        type: 'select',
        default: '1d',
        options: ['1d', '1wk', '1mo'],
        description: 'Candle interval',
      },
      target_increase: {
        label: 'Target Increase (%)',
        type: 'number',
        default: 20,
        description: 'Minimum percentage increase to detect',
      },
    },
  },
};

