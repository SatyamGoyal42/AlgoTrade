import React, { useState, useEffect } from 'react';
import { algorithmAPI, algorithms, stockListsAPI } from '../services/api';

export default function Playground() {
  const [inputType, setInputType] = useState('symbol'); // 'symbol', 'list', or 'file'
  const [symbol, setSymbol] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [stockLists, setStockLists] = useState([]);
  const [selectedAlgo, setSelectedAlgo] = useState('v20');
  const [algoParams, setAlgoParams] = useState({
    period: '6mo',
    interval: '1d',
    target_increase: 20,
    auto_adjusted: true,
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch stock lists
  useEffect(() => {
    const fetchStockLists = async () => {
      try {
        const response = await stockListsAPI.getAll();
        setStockLists(response.data);
      } catch (err) {
        console.error('Failed to fetch stock lists:', err);
      }
    };
    fetchStockLists();
  }, []);

  const handleParamChange = (key, value) => {
    setAlgoParams((prev) => ({
      ...prev,
      [key]: key === 'target_increase' ? parseFloat(value) : value,
    }));
  };

  const handleAutoAdjustedToggle = (checked) => {
    setAlgoParams((prev) => ({
      ...prev,
      auto_adjusted: checked,
    }));
  };

  const handleRun = async () => {
    if (inputType === 'symbol' && !symbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }

    if (inputType === 'list' && !selectedListId) {
      setError('Please select a stock list');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let response;
      
      if (inputType === 'symbol') {
        // Run on single symbol
        response = await algorithmAPI.runOnSymbol(
          symbol.trim().toUpperCase(),
          selectedAlgo,
          algoParams,
          false // persist = false for playground
        );
      } else if (inputType === 'list') {
        // Run on stock list
        response = await algorithmAPI.runOnList(
          parseInt(selectedListId),
          selectedAlgo,
          algoParams,
          false // persist = false for playground
        );
      } else {
        // File input (coming soon)
        setError('File input not yet implemented');
        setLoading(false);
        return;
      }
      
      setResults(response.data.results);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to run algorithm');
      console.error('Algorithm error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedAlgoInfo = algorithms[selectedAlgo];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Playground</h1>
      </div>

      {/* Input Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Input Selection</h2>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => {
              setInputType('symbol');
              setSelectedListId('');
            }}
            className={`px-4 py-2 rounded-md ${
              inputType === 'symbol'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Individual Stock
          </button>
          <button
            onClick={() => {
              setInputType('list');
              setSymbol('');
            }}
            className={`px-4 py-2 rounded-md ${
              inputType === 'list'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stock List
          </button>
          <button
            onClick={() => setInputType('file')}
            className={`px-4 py-2 rounded-md ${
              inputType === 'file'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Stock File
          </button>
        </div>

        {inputType === 'symbol' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g., TCS, RELIANCE, INFY"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        ) : inputType === 'list' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Stock List
            </label>
            {stockLists.length === 0 ? (
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">No stock lists found.</p>
                <a
                  href="/collections"
                  className="text-sm text-red-600 hover:text-red-700 underline"
                >
                  Create a stock list first →
                </a>
              </div>
            ) : (
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a stock list...</option>
                {stockLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.stocks?.length || 0} stocks)
                  </option>
                ))}
              </select>
            )}
            {selectedListId && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-2">
                  Stocks in this list:
                </p>
                <div className="flex flex-wrap gap-2">
                  {stockLists.find(l => l.id === parseInt(selectedListId))?.stocks?.map((symbol, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white px-2 py-1 rounded border border-gray-200"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-600">
            <p>Stock file selection coming soon...</p>
            <p className="text-sm mt-2">Currently, use individual stock symbol or stock list option</p>
          </div>
        )}
      </div>

      {/* Algorithm Selection */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Algorithm Selection</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Algorithm
          </label>
          <select
            value={selectedAlgo}
            onChange={(e) => setSelectedAlgo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {Object.keys(algorithms).map((key) => (
              <option key={key} value={key}>
                {algorithms[key].displayName}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-2">{selectedAlgoInfo.description}</p>
        </div>

        {/* Algorithm Parameters */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(selectedAlgoInfo.parameters).map(([key, param]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {param.label}
                </label>
                {param.type === 'select' ? (
                  <select
                    value={algoParams[key]}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {param.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={param.type}
                    value={algoParams[key]}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">{param.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Auto Adjust Toggle */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto Adjust Prices
              </label>
              <p className="text-xs text-gray-500">
                Automatically adjust stock prices for splits and dividends
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={algoParams.auto_adjusted}
                onChange={(e) => handleAutoAdjustedToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {algoParams.auto_adjusted ? 'ON' : 'OFF'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Run Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRun}
          disabled={
            loading || 
            (inputType === 'symbol' && !symbol.trim()) ||
            (inputType === 'list' && !selectedListId) ||
            (inputType === 'file')
          }
          className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Running...' : 'Run Algorithm'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Results</h2>
            {results.length > 0 && !results[0]?.error && (
              <div className="flex items-center gap-4">
                {(() => {
                  const buyingOpportunities = results.filter(r => (r.percentage_from_bp_to_today || 0) < 0).length;
                  const smallGains = results.filter(r => {
                    const val = r.percentage_from_bp_to_today || 0;
                    return val >= 0 && val <= 3;
                  }).length;
                  
                  return (
                    <>
                      {buyingOpportunities > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                          <span className="text-green-800 font-semibold">
                            🎯 {buyingOpportunities} Buying Opportunity{buyingOpportunities > 1 ? 'ies' : ''}
                          </span>
                        </div>
                      )}
                      {smallGains > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <span className="text-yellow-800 font-semibold">
                            📊 {smallGains} Small Gain{smallGains > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
                <span className="text-sm text-gray-600">
                  Total: {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          
          {results.length === 0 ? (
            <p className="text-gray-600">No results found for the given criteria.</p>
          ) : results[0]?.error ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
              {results[0].error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LP Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HP Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LP Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HP Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Increase %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From BP to Today %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, idx) => {
                    const bpToToday = result.percentage_from_bp_to_today || 0;
                    const isBuyingOpportunity = bpToToday < 0; // Negative = cheaper than BP
                    const isSmallGain = bpToToday >= 0 && bpToToday <= 3; // 0-3% gain
                    
                    let rowClass = 'hover:bg-gray-50';
                    let badgeClass = '';
                    let badgeText = '';
                    let percentageClass = 'text-gray-500';
                    
                    if (isBuyingOpportunity) {
                      rowClass = 'bg-green-50 border-l-4 border-green-400 hover:bg-green-100';
                      badgeClass = 'bg-green-100 text-green-800';
                      badgeText = '🎯 Buying Opportunity';
                      percentageClass = 'text-green-700';
                    } else if (isSmallGain) {
                      rowClass = 'bg-yellow-50 border-l-4 border-yellow-400 hover:bg-yellow-100';
                      badgeClass = 'bg-yellow-100 text-yellow-800';
                      badgeText = '📊 Small Gain';
                      percentageClass = 'text-yellow-700';
                    }
                    
                    return (
                      <tr 
                        key={idx} 
                        className={rowClass}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.symbol}
                          {(isBuyingOpportunity || isSmallGain) && (
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                              {badgeText}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.lp_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.hp_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{result.lp_price?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{result.hp_price?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {result.percentage_increase?.toFixed(2)}%
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${percentageClass}`}>
                          {bpToToday.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

