import React from 'react';
import { algorithms } from '../services/api';

export default function AlgoPatterns() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Algorithm Patterns</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {Object.values(algorithms).map((algo) => (
          <div key={algo.name} className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-red-600">{algo.displayName}</h2>
                <p className="text-gray-600 mt-2">{algo.description}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(algo.parameters).map(([key, param]) => (
                  <div key={key} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{param.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Default: {param.default}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{param.description}</p>
                    {param.options && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Available options:</p>
                        <div className="flex flex-wrap gap-1">
                          {param.options.map((opt) => (
                            <span
                              key={opt}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-2">How It Works</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {algo.name === 'v20' ? (
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Analyzes historical price data for consecutive green candles</li>
                    <li>Identifies sequences where the stock price increases by the target percentage</li>
                    <li>Finds the lowest point (LP) and highest point (HP) within each green candle sequence</li>
                    <li>Calculates percentage increase from LP to HP</li>
                    <li>Returns signals where the increase meets or exceeds the target threshold</li>
                    <li>Also calculates percentage change from LP to current price</li>
                  </ul>
                ) : (
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Uses the same green candle sequence analysis as V20</li>
                    <li>Additionally calculates the 200-day Simple Moving Average (SMA-200)</li>
                    <li>Only returns signals where the low price (LP) is below the SMA-200</li>
                    <li>This filter helps identify stocks that are potentially undervalued</li>
                    <li>Combines momentum analysis with mean reversion strategy</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

