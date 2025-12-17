import React, { useState, useEffect } from 'react';
import { stockListsAPI } from '../services/api';
import ParameterInput from './ParameterInput';

export default function StrategyForm({
  algo,
  onSubmit,
  initialData = {},
  showPersist = true,
  submitButtonText = 'Run Strategy',
  loading = false,
  error = null,
  success = null,
  size = 'normal',
}) {
  const [stockLists, setStockLists] = useState([]);
  const [formData, setFormData] = useState({
    symbol: '',
    listId: '',
    persist: false,
    ...Object.keys(algo?.parameters || {}).reduce((acc, key) => {
      acc[key] = algo?.parameters[key]?.default || '';
      return acc;
    }, {}),
    ...initialData,
  });

  useEffect(() => {
    fetchStockLists();
  }, []);

  const fetchStockLists = async () => {
    try {
      const response = await stockListsAPI.getAll();
      setStockLists(response.data);
    } catch (err) {
      console.error('Failed to fetch stock lists:', err);
    }
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.symbol && !formData.listId) {
      return;
    }

    // Extract algorithm parameters
    const algoParams = {};
    Object.keys(algo.parameters || {}).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== '' && formData[key] !== null) {
        algoParams[key] = formData[key];
      }
    });

    // Call the onSubmit callback with form data
    onSubmit({
      symbol: formData.symbol,
      listId: formData.listId,
      persist: formData.persist,
      algoParams,
    });
  };

  if (!algo) {
    return null;
  }

  const isCompact = size === 'compact';
  const containerClasses = isCompact 
    ? 'bg-white border-2 border-black p-4'
    : 'bg-white border-2 border-black p-6 max-w-2xl';
  const headingClasses = isCompact
    ? 'text-sm font-bold text-black'
    : 'text-lg font-bold text-black';
  const inputClasses = isCompact
    ? 'text-xs'
    : 'text-sm';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Symbol or List Selection */}
      <div className="space-y-4">
        <div>
          <label className={`block ${inputClasses} font-bold text-black mb-2`}>
            Stock Symbol
          </label>
          <input
            type="text"
            value={formData.symbol}
            onChange={(e) => {
              handleInputChange('symbol', e.target.value);
              if (e.target.value) handleInputChange('listId', '');
            }}
            placeholder="e.g., AAPL, TCS.NS"
            className={`input-xp w-full ${isCompact ? 'px-3 py-1.5' : 'px-4 py-2'} ${inputClasses}`}
            disabled={!!formData.listId}
          />
        </div>

        <div className="text-center text-black text-sm font-bold">OR</div>

        <div>
          <label className={`block ${inputClasses} font-bold text-black mb-2`}>
            Stock List
          </label>
          <select
            value={formData.listId}
            onChange={(e) => {
              handleInputChange('listId', e.target.value);
              if (e.target.value) handleInputChange('symbol', '');
            }}
            className={`input-xp w-full ${isCompact ? 'px-3 py-1.5' : 'px-4 py-2'} ${inputClasses}`}
            disabled={!!formData.symbol}
          >
            <option value="">Select a stock list</option>
            {stockLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} ({list.stocks?.length || 0} stocks)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Algorithm Parameters */}
      <div className="space-y-4">
        <h3 className={headingClasses}>Parameters</h3>
        {Object.entries(algo.parameters || {}).map(([key, param]) => (
          <ParameterInput
            key={key}
            param={param}
            value={formData[key]}
            onChange={(value) => handleInputChange(key, value)}
            className={isCompact ? 'text-xs' : ''}
          />
        ))}
      </div>


      {/* Persist Option */}
      {showPersist && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="persist"
            checked={formData.persist}
            onChange={(e) => handleInputChange('persist', e.target.checked)}
            className="h-4 w-4 border-2 border-black"
          />
          <label htmlFor="persist" className={`ml-2 ${inputClasses} text-black`}>
            Persist results to database
          </label>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-200 border-2 border-black px-4 py-3 text-black">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-gray-300 border-2 border-black px-4 py-3 text-black">
          {success}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || (!formData.symbol && !formData.listId)}
        className="btn-xp w-full"
      >
        {loading ? 'Processing...' : submitButtonText}
      </button>
    </form>
  );
}

