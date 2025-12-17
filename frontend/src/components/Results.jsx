import React from 'react';

export function RunResults({ results }) {
  console.log('RunResults received:', results);
  console.log('Results type:', typeof results);
  console.log('Is array:', Array.isArray(results));
  
  if (!results || (Array.isArray(results) && results.length === 0)) {
    return (
      <div className="bg-white border-2 border-black p-6" style={{ boxShadow: '2px 2px 0px #000' }}>
        <h2 className="text-lg font-bold mb-4 text-black">Results</h2>
        <p className="text-black">No results found.</p>
      </div>
    );
  }

  const resultsArray = Array.isArray(results) ? results : [results];
  const hasErrors = resultsArray.some(r => r && r.error);
  const validResults = resultsArray.filter(r => r && !r.error);
  console.log('Valid results:', validResults);

  return (
    <div className="bg-white border-2 border-black p-4" style={{ boxShadow: '2px 2px 0px #000' }}>
      <h2 className="text-lg font-bold mb-4 text-black">Results</h2>
      
      {hasErrors && (
        <div className="mb-4 bg-red-200 border-2 border-black p-3">
          <p className="text-xs font-bold text-black mb-2">Errors:</p>
          {results.filter(r => r.error).map((r, idx) => (
            <p key={idx} className="text-xs text-black">
              {r.symbol}: {r.error}
            </p>
          ))}
        </div>
      )}

      {validResults.length > 0 && (
        <>
          <div className="mb-4">
            <p className="text-sm font-bold text-black">
              Found {validResults.length} signal{validResults.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-black">
              <thead className="bg-gray-300 border-2 border-black">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-black border-r-2 border-black">Symbol</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-black border-r-2 border-black">LP Date</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-black border-r-2 border-black">HP Date</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-black border-r-2 border-black">LP Price</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-black border-r-2 border-black">HP Price</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-black border-r-2 border-black">% Increase</th>
                  <th className="px-3 py-2 text-left text-xs font-bold text-black">% LP to Today</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {validResults.map((result, idx) => {
                  if (idx === 0) {
                    console.log('Sample result object:', result);
                    console.log('Result keys:', Object.keys(result || {}));
                  }

                  const lpToTodayValue =
                    result.percentageFromHighPriceToToday != null
                      ? Number(result.percentageFromHighPriceToToday)
                      : null;

                  const lpToTodayHighlightClass =
                    lpToTodayValue == null || Number.isNaN(lpToTodayValue)
                      ? ''
                      : lpToTodayValue < 0
                      ? 'bg-green-200'
                      : lpToTodayValue <= 3
                      ? 'bg-yellow-200'
                      : '';

                  return (
                    <tr key={idx} className="border-b-2 border-black hover:bg-gray-200">
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black font-bold">
                        {result?.symbol || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">
                        {result.lowPriceDate || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">
                        {result.highPriceDate || 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">
                        {result.lowPrice != null ? Number(result.lowPrice).toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black border-r-2 border-black">
                        {result.highPrice != null ? Number(result.highPrice).toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-black border-r-2 border-black">
                        {result.percentageIncrease != null ? `${Number(result.percentageIncrease).toFixed(2)}%` : 'N/A'}
                      </td>
                      <td
                        className={`px-3 py-2 whitespace-nowrap text-xs font-bold text-black ${lpToTodayHighlightClass}`}
                      >
                        {lpToTodayValue != null && !Number.isNaN(lpToTodayValue)
                          ? `${lpToTodayValue.toFixed(2)}%`
                          : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {validResults.length > 1 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-gray-300 border-2 border-black p-2">
                <p className="text-xs text-black font-bold mb-1">Total Signals</p>
                <p className="text-sm font-bold text-black">{validResults.length}</p>
              </div>
              <div className="bg-gray-300 border-2 border-black p-2">
                <p className="text-xs text-black font-bold mb-1">Avg % Increase</p>
                <p className="text-sm font-bold text-black">
                  {(
                    validResults.reduce((sum, r) => {
                      const val = r.percentageIncrease != null ? Number(r.percentageIncrease) : 0;
                      return sum + (isNaN(val) ? 0 : val);
                    }, 0) / validResults.length
                  ).toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-300 border-2 border-black p-2">
                <p className="text-xs text-black font-bold mb-1">Unique Symbols</p>
                <p className="text-sm font-bold text-black">
                  {new Set(validResults.map(r => r.symbol)).size}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


