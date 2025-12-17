import React from 'react';
import { useNavigate } from 'react-router-dom';
import { algorithms } from '../services/api';

export default function StrategiesList() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-200 p-8">
      <h1 className="text-3xl font-bold mb-8 text-black">Strategies</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(algorithms).map((algo) => (
          <div
            key={algo.name}
            className="bg-white p-4 border-2 border-black"
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2 text-black">
                {algo.displayName}
              </h2>
              <p className="text-black text-sm">{algo.description}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t-2 border-black">
              <p className="text-xs text-black mb-2 font-bold">Parameters:</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(algo.parameters).slice(0, 3).map((key) => (
                  <span
                    key={key}
                    className="text-xs bg-gray-300 text-black px-2 py-1 border border-black"
                  >
                    {algo.parameters[key].label}
                  </span>
                ))}
                {Object.keys(algo.parameters).length > 3 && (
                  <span className="text-xs text-black">
                    +{Object.keys(algo.parameters).length - 3} more
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              {algo.run && (
                <button
                  onClick={() => navigate(`/strategies/${algo.name}/run`)}
                  className="btn-xp flex-1"
                >
                  Run
                </button>
              )}
              {algo.backtest && (
                <button
                  onClick={() => navigate(`/strategies/${algo.name}/backtest`)}
                  className="btn-xp flex-1"
                >
                  Backtest
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
