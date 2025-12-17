import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { algorithms, algorithmAPI } from '../services/api';
import StrategyForm from '../components/StrategyForm';

export default function StrategyBacktest() {
  const { strategy } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backtestResults, setBacktestResults] = useState(null);
  const [selectedEquityCurve, setSelectedEquityCurve] = useState(null);
  const [selectedEquityLabel, setSelectedEquityLabel] = useState(null);
  
  const algo = algorithms[strategy];

  const handleSubmit = async ({ symbol, listId, algoParams }) => {
    setLoading(true);
    setError(null);
    setBacktestResults(null);
    setSelectedEquityCurve(null);
    setSelectedEquityLabel(null);

    try {
      if (symbol) {
        const response = await algorithmAPI.backtestOnSymbol(
          symbol.toUpperCase(),
          strategy,
          algoParams
        );
        setBacktestResults(response.data);
        console.log('Backtest Response:', response.data);
      } else if (listId) {
        const response = await algorithmAPI.backtestOnList(
          listId,
          strategy,
          algoParams
        );
        setBacktestResults(response.data);
        console.log('Backtest Response:', response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run backtest');
    } finally {
      setLoading(false);
    }
  };

  const handleShowEquityCurve = (curveData = [], label = '') => {
    const sanitizedData = Array.isArray(curveData) ? curveData : [];
    setSelectedEquityCurve(sanitizedData);
    setSelectedEquityLabel(label || null);
  };

  const handleClearEquityCurve = () => {
    setSelectedEquityCurve(null);
    setSelectedEquityLabel(null);
  };

  if (!algo) {
    navigate('/strategies');
    return null;
  }

  if (!algo.backtest) {
    navigate('/strategies');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-200 p-8">
      <button
        onClick={() => navigate('/strategies')}
        className="btn-xp mb-6 text-sm"
      >
        ← Back to Strategies
      </button>

      <h1 className="text-3xl font-bold mb-2 text-black">
        {algo.displayName} - Backtest
      </h1>
      <p className="text-black mb-8">{algo.description}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Configuration Panel */}
        <div className="space-y-4">
          <div className="bg-white border-2 border-black p-6" style={{ boxShadow: '2px 2px 0px #000' }}>
            <h2 className="text-lg font-bold mb-4 text-black">Configuration</h2>
            <StrategyForm
              algo={algo}
              onSubmit={handleSubmit}
              showPersist={false}
              submitButtonText="Run Backtest"
              loading={loading}
              error={error}
            />
          </div>
          {selectedEquityCurve && (
            <EquityCurveChart
              data={selectedEquityCurve}
              label={selectedEquityLabel}
              onClose={handleClearEquityCurve}
            />
          )}
        </div>

        {/* Results Panel */}
        <div>
          {backtestResults ? (
            <div className="bg-white border-2 border-black p-4" style={{ boxShadow: '2px 2px 0px #000' }}>
              <h2 className="text-lg font-bold mb-4 text-black">Backtest Results</h2>
              
              {/* Check if it's a single symbol result or list result */}
              {backtestResults.symbol ? (
                // Single symbol results
                <SingleSymbolResults
                  results={backtestResults}
                  onShowEquityCurve={handleShowEquityCurve}
                />
              ) : (
                // List results
                <ListResults
                  results={backtestResults}
                  onShowEquityCurve={handleShowEquityCurve}
                />
              )}
            </div>
          ) : (
            <div className="bg-white border-2 border-black p-12 text-center" style={{ boxShadow: '2px 2px 0px #000' }}>
              <p className="text-black">Configure parameters and run backtest to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component for displaying single symbol backtest results
function SingleSymbolResults({ results, onShowEquityCurve }) {
  if (results.error || !results.success) {
    return (
      <div className="bg-red-200 border-2 border-black px-4 py-3 text-black">
        {results.error || 'Backtest failed'}
      </div>
    );
  }

  const hasEquityCurve =
    Array.isArray(results.equity_curve) && results.equity_curve.length > 0;

  const handleEquityCurveClick = () => {
    if (onShowEquityCurve) {
      onShowEquityCurve(results.equity_curve || [], results.symbol || 'Symbol');
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="text-base md:text-lg font-bold text-black">
          {results.symbol || 'Symbol'}
        </h3>
        {hasEquityCurve && (
          <button
            type="button"
            onClick={handleEquityCurveClick}
            className="text-xs font-semibold text-black border border-black px-3 py-1 bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            See equity curve
          </button>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-300 border-2 border-black p-3">
          <p className="text-xs text-black mb-1 font-bold">Total Trades</p>
          <p className="text-xl font-bold text-black">{results.num_trades || 0}</p>
        </div>
        <div className="bg-gray-300 border-2 border-black p-3">
          <p className="text-xs text-black mb-1 font-bold">Win Rate</p>
          <p className="text-xl font-bold text-black">
            {results.win_rate ? results.win_rate.toFixed(2) : 0}%
          </p>
        </div>
        <div className="bg-gray-300 border-2 border-black p-3">
          <p className="text-xs text-black mb-1 font-bold">CAGR</p>
          <p className="text-xl font-bold text-black">
            {results.cagr ? results.cagr.toFixed(2) : 0}%
          </p>
        </div>
        <div className="bg-gray-300 border-2 border-black p-3">
          <p className="text-xs text-black mb-1 font-bold">Sharpe Ratio</p>
          <p className="text-xl font-bold text-black">
            {results.sharpe_ratio ? results.sharpe_ratio.toFixed(2) : 0}
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        <div>
          <p className="text-xs text-black font-bold">Total Return</p>
          <p className="text-sm font-bold text-black">
            {results.total_return ? results.total_return.toFixed(2) : 0}%
          </p>
        </div>
        <div>
          <p className="text-xs text-black font-bold">Max Drawdown</p>
          <p className="text-sm font-bold text-black">
            {results.max_drawdown ? results.max_drawdown.toFixed(2) : 0}%
          </p>
        </div>
        <div>
          <p className="text-xs text-black font-bold">Avg Trade Return</p>
          <p className="text-sm font-bold text-black">
            {results.average_trade_return ? results.average_trade_return.toFixed(2) : 0}%
          </p>
        </div>
        <div>
          <p className="text-xs text-black font-bold">Profit Factor</p>
          <p className="text-sm font-bold text-black">
            {results.profit_factor ? results.profit_factor.toFixed(2) : 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-black font-bold">Buy & Hold Return</p>
          <p className="text-sm font-bold text-black">
            {results.buy_hold_return ? results.buy_hold_return.toFixed(2) : 0}%
          </p>
        </div>
        <div>
          <p className="text-xs text-black font-bold">Final Capital</p>
          <p className="text-sm font-bold text-black">
            {results.final_capital ? results.final_capital.toFixed(2) : 0}
          </p>
        </div>
      </div>

      {/* Trades Table */}
      {results.trades && results.trades.length > 0 && (
        <div>
          <h3 className="text-base font-bold mb-2 text-black">Trades</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-black">
              <thead className="bg-gray-300 border-2 border-black">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">Entry Date</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">Exit Date</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">Entry Price</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">Exit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">Return</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-black">Days Held</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {results.trades.map((trade, idx) => (
                  <tr key={idx} className="border-b-2 border-black hover:bg-gray-200">
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">{trade.entry_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">{trade.exit_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">{trade.entry_price?.toFixed(2) || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">{trade.exit_price?.toFixed(2) || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-black border-r-2 border-black">
                      {trade.return_pct >= 0 ? '+' : ''}{trade.return_pct ? (trade.return_pct * 100).toFixed(2) : 0}%
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-black">{trade.days_held || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// Component for displaying list backtest results
function ListResults({ results, onShowEquityCurve }) {
  const [expandedSymbols, setExpandedSymbols] = useState({});

  const symbolResults = results.symbol_results || [];
  const successfulResults = symbolResults.filter(
    (symbolResult) => symbolResult.success !== false && !symbolResult.error
  );
  const failedResults = symbolResults.filter(
    (symbolResult) => symbolResult.success === false || symbolResult.error
  );

  const toggleSymbol = (key) => {
    setExpandedSymbols((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-300 border-2 border-black p-3">
            <p className="text-xs text-black mb-1 font-bold">Total Symbols</p>
            <p className="text-xl font-bold text-black">
              {results.total_symbols || 0}
            </p>
          </div>
          <div className="bg-gray-300 border-2 border-black p-3">
            <p className="text-xs text-black mb-1 font-bold">Successful</p>
            <p className="text-xl font-bold text-black">
              {results.successful_backtests || 0}
            </p>
          </div>
          <div className="bg-gray-300 border-2 border-black p-3">
            <p className="text-xs text-black mb-1 font-bold">Failed</p>
            <p className="text-xl font-bold text-black">
              {results.failed_backtests || 0}
            </p>
          </div>
        </div>

        {/* Portfolio Averages Section */}
        {results.portfolio_averages && (
          <div className="bg-blue-50 border-2 border-black p-4 mb-4">
            <h3 className="text-base font-bold mb-3 text-black">Portfolio Averages</h3>
            <div className="mb-2">
              <p className="text-xs text-black font-semibold">
                Stocks with trades: {results.num_stocks_with_trades || 0} / {results.total_symbols || 0}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white border-2 border-black p-2">
                <p className="text-xs text-black mb-1 font-bold">Avg Portfolio Returns</p>
                <p className="text-lg font-bold text-black">
                  {results.portfolio_averages.avg_portfolio_returns !== undefined
                    ? results.portfolio_averages.avg_portfolio_returns.toFixed(2)
                    : 0}%
                </p>
              </div>
              <div className="bg-white border-2 border-black p-2">
                <p className="text-xs text-black mb-1 font-bold">Avg Portfolio CAGR</p>
                <p className="text-lg font-bold text-black">
                  {results.portfolio_averages.avg_portfolio_cagr !== undefined
                    ? results.portfolio_averages.avg_portfolio_cagr.toFixed(2)
                    : 0}%
                </p>
              </div>
              <div className="bg-white border-2 border-black p-2">
                <p className="text-xs text-black mb-1 font-bold">Avg Portfolio Sharpe</p>
                <p className="text-lg font-bold text-black">
                  {results.portfolio_averages.avg_portfolio_sharpe !== undefined
                    ? results.portfolio_averages.avg_portfolio_sharpe.toFixed(2)
                    : 0}
                </p>
              </div>
              <div className="bg-white border-2 border-black p-2">
                <p className="text-xs text-black mb-1 font-bold">Avg Total Return</p>
                <p className="text-lg font-bold text-black">
                  {results.portfolio_averages.avg_total_return !== undefined
                    ? results.portfolio_averages.avg_total_return.toFixed(2)
                    : 0}%
                </p>
              </div>
              <div className="bg-white border-2 border-black p-2">
                <p className="text-xs text-black mb-1 font-bold">Avg Win Rate</p>
                <p className="text-lg font-bold text-black">
                  {results.portfolio_averages.avg_winrate !== undefined
                    ? results.portfolio_averages.avg_winrate.toFixed(2)
                    : 0}%
                </p>
              </div>
              <div className="bg-white border-2 border-black p-2">
                <p className="text-xs text-black mb-1 font-bold">Avg Days Held</p>
                <p className="text-lg font-bold text-black">
                  {results.portfolio_averages.avg_days_held !== undefined
                    ? results.portfolio_averages.avg_days_held.toFixed(1)
                    : 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {successfulResults.length > 0 ? (
        <div>
          <h3 className="text-base font-bold mb-2 text-black">Successful Symbols</h3>
          <div className="space-y-2">
            {successfulResults.map((symbolResult, idx) => {
              const key = symbolResult.symbol || `symbol-${idx}`;
              const isExpanded = !!expandedSymbols[key];
              const hasEquityCurve =
                Array.isArray(symbolResult.equity_curve) && symbolResult.equity_curve.length > 0;

              const handleEquityCurveClick = (event) => {
                event.stopPropagation();
                if (onShowEquityCurve) {
                  onShowEquityCurve(
                    symbolResult.equity_curve || [],
                    symbolResult.symbol || `Symbol ${idx + 1}`
                  );
                }
              };

              return (
                <div
                  key={key}
                  className="border-2 border-black bg-white"
                >
                  <div
                    className="w-full text-left px-3 py-3 hover:bg-gray-200 transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSymbol(key)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleSymbol(key);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-bold text-black text-sm md:text-base">
                        {symbolResult.symbol}
                      </h4>
                      <div className="flex items-center gap-3">
                        {hasEquityCurve && (
                          <button
                            type="button"
                            onClick={handleEquityCurveClick}
                            className="text-xs font-semibold text-black border border-black px-2 py-1 bg-gray-200 hover:bg-gray-300 transition-colors"
                          >
                            See equity curve
                          </button>
                        )}
                        <span className="text-xs font-semibold text-gray-700">
                          {isExpanded ? 'Hide trades' : 'Show trades'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-3">
                      <div>
                        <span className="text-black font-bold block">Trades</span>
                        <span className="font-bold text-black">
                          {symbolResult.num_trades || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-black font-bold block">Avg Return</span>
                        <span className="font-bold text-black">
                          {symbolResult.average_trade_return
                            ? symbolResult.average_trade_return.toFixed(2)
                            : 0}
                          %
                        </span>
                      </div>
                      <div>
                        <span className="text-black font-bold block">CAGR</span>
                        <span className="font-bold text-black">
                          {symbolResult.cagr ? symbolResult.cagr.toFixed(2) : 0}%
                        </span>
                      </div>
                      <div>
                        <span className="text-black font-bold block">Sharpe</span>
                        <span className="font-bold text-black">
                          {symbolResult.sharpe_ratio
                            ? symbolResult.sharpe_ratio.toFixed(2)
                            : 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
                        <div>
                          <span className="text-black font-bold block">Total Return</span>
                          <span className="font-bold text-black">
                            {symbolResult.total_return
                              ? symbolResult.total_return.toFixed(2)
                              : 0}
                            %
                          </span>
                        </div>
                        <div>
                          <span className="text-black font-bold block">Max Drawdown</span>
                          <span className="font-bold text-black">
                            {symbolResult.max_drawdown
                              ? symbolResult.max_drawdown.toFixed(2)
                              : 0}
                            %
                          </span>
                        </div>
                        <div>
                          <span className="text-black font-bold block">Win Rate</span>
                          <span className="font-bold text-black">
                            {symbolResult.win_rate
                              ? symbolResult.win_rate.toFixed(2)
                              : 0}
                            %
                          </span>
                        </div>
                        <div>
                          <span className="text-black font-bold block">Avg Days Held</span>
                          <span className="font-bold text-black">
                            {symbolResult.avg_days_held
                              ? symbolResult.avg_days_held.toFixed(1)
                              : 0}
                          </span>
                        </div>
                      </div>

                      {symbolResult.trades && symbolResult.trades.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-2 border-black">
                            <thead className="bg-gray-300 border-2 border-black">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">
                                  Entry Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">
                                  Exit Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">
                                  Entry Price
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">
                                  Exit Price
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">
                                  Return %
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-black">
                                  Days Held
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {symbolResult.trades.map((trade, tradeIdx) => (
                                <tr
                                  key={`${symbolResult.symbol}-trade-${tradeIdx}`}
                                  className="border-b-2 border-black hover:bg-gray-200"
                                >
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">
                                    {trade.entry_date}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">
                                    {trade.exit_date}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">
                                    {trade.entry_price !== undefined && trade.entry_price !== null
                                      ? trade.entry_price.toFixed(2)
                                      : 'N/A'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">
                                    {trade.exit_price !== undefined && trade.exit_price !== null
                                      ? trade.exit_price.toFixed(2)
                                      : 'N/A'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-black border-r-2 border-black">
                                    {trade.return_pct !== undefined && trade.return_pct !== null
                                      ? `${(trade.return_pct * 100).toFixed(2)}%`
                                      : '0.00%'}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-black">
                                    {trade.days_held || 0}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-black">No trades executed.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-black mb-4">No successful backtests.</p>
      )}

      {failedResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-base font-bold mb-2 text-black">Failed Symbols</h3>
          <div className="space-y-2">
            {failedResults.map((symbolResult, idx) => (
              <div
                key={`failed-${symbolResult.symbol || idx}`}
                className="border-2 border-black p-3 bg-red-100"
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-black">{symbolResult.symbol || 'Unknown'}</h4>
                  <span className="text-xs bg-red-200 text-black px-2 py-1 border border-black font-bold">
                    Failed
                  </span>
                </div>
                <p className="text-xs text-black">
                  {symbolResult.error || 'Backtest failed for this symbol.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function EquityCurveChart({ data, label, onClose }) {
  const hasData = Array.isArray(data) && data.length > 0;
  const chartWidth = 400;
  const chartHeight = 200;

  const values = hasData ? data.map((point) => point.equity ?? 1) : [1];
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const denominator = Math.max((data?.length || 1) - 1, 1);

  const coordinates = hasData
    ? data.map((point, index) => {
        const value = point.equity ?? 1;
        const x = (index / denominator) * chartWidth;
        const y = chartHeight - ((value - minValue) / range) * chartHeight;
        return `${x},${y}`;
      })
    : [];

  const startDate = hasData ? data[0].date : null;
  const endDate = hasData ? data[data.length - 1].date : null;
  const finalEquity = hasData ? data[data.length - 1].equity : 1;

  return (
    <div
      className="bg-white border-2 border-black p-4"
      style={{ boxShadow: '2px 2px 0px #000' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-black">Equity Curve</h3>
          {label && (
            <p className="text-xs text-black mt-1">
              {label} • Final equity&nbsp;
              <span className="font-semibold">
                {finalEquity ? finalEquity.toFixed(2) : '0.00'}
              </span>
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-black border border-black px-2 py-1 bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {hasData ? (
        <>
          <div className="mt-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48"
              preserveAspectRatio="none"
            >
              <rect
                x="0"
                y="0"
                width={chartWidth}
                height={chartHeight}
                fill="#f5f5f5"
                stroke="#111"
                strokeWidth="1"
              />
              <polyline
                points={coordinates.join(' ')}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
              />
              <line
                x1="0"
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#111"
                strokeWidth="1"
              />
            </svg>
          </div>
          <div className="flex justify-between text-xs text-black mt-2">
            <span>{startDate}</span>
            <span>{endDate}</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-black mt-4">No equity data available.</p>
      )}
    </div>
  );
}

