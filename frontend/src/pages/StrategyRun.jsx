import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { algorithms, algorithmAPI } from '../services/api';
import StrategyForm from '../components/StrategyForm';
import { RunResults } from '../components/Results';

export default function StrategyRun() {
  const { strategy } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [results, setResults] = useState(null);
  
  const algo = algorithms[strategy];

  const handleSubmit = async ({ symbol, listId, persist, algoParams }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResults(null);

    try {
      if (symbol) {
        // Run on single symbol
        const response = await algorithmAPI.runOnSymbol(
          symbol.toUpperCase(),
          strategy,
          algoParams,
          persist
        );
        setSuccess(`Algorithm executed successfully on ${symbol}!`);
        console.log('Full Response:', response);
        console.log('Response Data:', response.data);
        console.log('Response Data Results:', response.data?.results);
        
        let resultsData = null;
        if (response.data) {
          if (response.data.results) {
            resultsData = response.data.results;
          } else if (Array.isArray(response.data)) {
            resultsData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            resultsData = response.data.data;
          }
        }
        
        console.log('Final Results Data:', resultsData);
        setResults(Array.isArray(resultsData) ? resultsData : []);
      } else if (listId) {
        // Run on stock list
        const response = await algorithmAPI.runOnList(
          listId,
          strategy,
          algoParams,
          persist
        );
        setSuccess(`Algorithm executed successfully on stock list!`);
        console.log('Full Response:', response);
        console.log('Response Data:', response.data);
        console.log('Response Data Results:', response.data?.results);
        
        let resultsData = null;
        if (response.data) {
          if (response.data.results) {
            resultsData = response.data.results;
          } else if (Array.isArray(response.data)) {
            resultsData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            resultsData = response.data.data;
          }
        }
        
        console.log('Final Results Data:', resultsData);
        setResults(Array.isArray(resultsData) ? resultsData : []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to execute algorithm');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  if (!algo) {
    navigate('/strategies');
    return null;
  }

  if (!algo.run) {
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
        {algo.displayName}
      </h1>
      <p className="text-black mb-8">{algo.description}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Strategy Form */}
        <div className="bg-white border-2 border-black p-6" style={{ boxShadow: '2px 2px 0px #000' }}>
          <StrategyForm
            algo={algo}
            onSubmit={handleSubmit}
            showPersist={true}
            submitButtonText="Run Strategy"
            loading={loading}
            error={error}
            success={success}
          />
        </div>

        {/* Results Panel */}
        <div>
          {results && <RunResults results={results} />}
        </div>
      </div>
    </div>
  );
}

