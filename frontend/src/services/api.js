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
};

// Algorithm information
export const algorithms = {
  v20: {
    name: 'v20',
    displayName: 'V20 Algorithm',
    description: 'Identifies green candle sequences and finds periods where stocks increase by a target percentage (default 20%) within consecutive green candles.',
    parameters: {
      period: {
        label: 'Period',
        type: 'select',
        default: '6mo',
        options: ['1mo', '3mo', '6mo', '1y', '2y'],
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
    parameters: {
      period: {
        label: 'Period',
        type: 'select',
        default: '6mo',
        options: ['1mo', '3mo', '6mo', '1y', '2y'],
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

