import React, { useState, useEffect } from 'react';
import { stockListsAPI } from '../services/api';

export default function StockCollections() {
  const [stockLists, setStockLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const [addingStock, setAddingStock] = useState(false);
  const [bulkAddResults, setBulkAddResults] = useState(null);

  // Fetch all stock lists
  const fetchStockLists = async () => {
    setLoading(true);
    try {
      const response = await stockListsAPI.getAll();
      setStockLists(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch stock lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockLists();
  }, []);

  // Create new stock list
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setError('Please enter a list name');
      return;
    }

    try {
      await stockListsAPI.create(newListName.trim());
      setNewListName('');
      setShowCreateModal(false);
      fetchStockLists();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create list');
    }
  };

  // Delete stock list
  const handleDeleteList = async (id) => {
    if (!window.confirm('Are you sure you want to delete this list?')) return;

    try {
      await stockListsAPI.delete(id);
      if (selectedList?.id === id) {
        setSelectedList(null);
      }
      fetchStockLists();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete list');
    }
  };

  // Fetch specific list details
  const handleSelectList = async (id) => {
    try {
      const response = await stockListsAPI.getById(id);
      setSelectedList(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch list details');
    }
  };

  // Parse stock symbols from input (comma or space separated)
  const parseStockSymbols = (input) => {
    if (!input.trim()) return [];
    
    // Split by comma first, then by space, and filter out empty strings
    const symbols = input
      .split(/[,\s]+/)
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);
    
    // Remove duplicates
    return [...new Set(symbols)];
  };

  // Add stock to list (single or multiple) - optimized bulk add
  const handleAddStock = async () => {
    const symbols = parseStockSymbols(newStockSymbol);
    
    if (symbols.length === 0) {
      setError('Please enter at least one stock symbol');
      return;
    }

    setAddingStock(true);
    setError(null);
    setSuccessMessage(null);
    setBulkAddResults(null);

    try {
      // Single API call for all stocks
      const response = await stockListsAPI.addStocksBulk(selectedList.id, symbols);
      const results = response.data.results || {
        added: [],
        duplicates: [],
        failed: [],
      };

      setBulkAddResults(results);

      // Refresh the list and update the sidebar count if any succeeded
      if (results.added && results.added.length > 0) {
        await handleSelectList(selectedList.id);
        await fetchStockLists();
        
        // Show success message
        const successMsg = results.added.length === 1
          ? `${results.added[0]} added successfully!`
          : `${results.added.length} stocks added successfully!`;
        setSuccessMessage(successMsg);
        setTimeout(() => setSuccessMessage(null), 5000);
      }

      // Clear input if all succeeded
      if (results.failed.length === 0 && results.duplicates.length === 0) {
        setNewStockSymbol('');
        setTimeout(() => {
          setShowAddStockModal(false);
          setBulkAddResults(null);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add stocks');
      setBulkAddResults({
        added: [],
        duplicates: [],
        failed: symbols.map(s => ({ symbol: s, error: err.response?.data?.error || 'Failed to add' })),
      });
    } finally {
      setAddingStock(false);
    }
  };

  // Remove stock from list
  const handleRemoveStock = async (symbol) => {
    if (!window.confirm(`Remove ${symbol} from this list?`)) return;

    try {
      await stockListsAPI.removeStock(selectedList.id, symbol);
      handleSelectList(selectedList.id); // Refresh list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove stock');
    }
  };

  // Update list name
  const handleUpdateList = async (id, newName) => {
    if (!newName.trim()) {
      setError('Please enter a list name');
      return;
    }

    try {
      await stockListsAPI.update(id, newName.trim());
      fetchStockLists();
      if (selectedList?.id === id) {
        setSelectedList({ ...selectedList, name: newName.trim() });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update list');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Collections</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold"
        >
          + Create New List
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="font-semibold hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="font-semibold hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Lists Sidebar */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Stock Lists</h2>
          
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : stockLists.length === 0 ? (
            <p className="text-gray-600">No stock lists found. Create one to get started!</p>
          ) : (
            <div className="space-y-2">
              {stockLists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => handleSelectList(list.id)}
                  className={`p-3 rounded-md cursor-pointer border-2 transition-colors ${
                    selectedList?.id === list.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{list.name}</h3>
                      <p className="text-sm text-gray-600">
                        {list.stocks?.length || 0} stocks
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = prompt('Enter new name:', list.name);
                          if (newName) handleUpdateList(list.id, newName);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected List Details */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
          {selectedList ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{selectedList.name}</h2>
                <button
                  onClick={() => {
                    setError(null);
                    setShowAddStockModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-semibold flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Add Stock</span>
                </button>
              </div>

              {selectedList.stocks && selectedList.stocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Symbol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedList.stocks.map((symbol, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleRemoveStock(symbol)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No stocks in this list. Add some stocks to get started!</p>
              )}
            </>
          ) : (
            <div className="text-center text-gray-600 py-12">
              <p>Select a stock list from the sidebar to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Create New Stock List</h3>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-2">Add Stock(s) to List</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedList?.name}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Symbol(s)
              </label>
              <textarea
                value={newStockSymbol}
                onChange={(e) => {
                  setNewStockSymbol(e.target.value.toUpperCase());
                  setError(null);
                  setBulkAddResults(null);
                }}
                placeholder="Enter stock symbols separated by commas or spaces&#10;Example: TCS, RELIANCE, INFY&#10;or: TCS RELIANCE INFY"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[100px] resize-y"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !addingStock) {
                    handleAddStock();
                  }
                }}
                autoFocus
                disabled={addingStock}
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple stocks with commas or spaces. Press Ctrl+Enter to add.
              </p>
            </div>

            {/* Bulk Add Results */}
            {bulkAddResults && (
              <div className="mb-4 space-y-2">
                {bulkAddResults.added && bulkAddResults.added.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm font-semibold text-green-800 mb-1">
                      ✓ Successfully Added ({bulkAddResults.added.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bulkAddResults.added.map((symbol) => (
                        <span
                          key={symbol}
                          className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded"
                        >
                          {symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {bulkAddResults.duplicates && bulkAddResults.duplicates.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">
                      ⚠ Already in List ({bulkAddResults.duplicates.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bulkAddResults.duplicates.map((symbol) => (
                        <span
                          key={symbol}
                          className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
                        >
                          {symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {bulkAddResults.failed && bulkAddResults.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm font-semibold text-red-800 mb-1">
                      ✗ Failed ({bulkAddResults.failed.length})
                    </p>
                    <div className="space-y-1">
                      {bulkAddResults.failed.map((item, idx) => (
                        <div key={idx} className="text-xs text-red-700">
                          <span className="font-medium">{item.symbol}:</span> {item.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 mb-2">{error}</p>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowAddStockModal(false);
                  setNewStockSymbol('');
                  setError(null);
                  setBulkAddResults(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                disabled={addingStock}
              >
                {bulkAddResults && bulkAddResults.success.length > 0 ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={handleAddStock}
                disabled={addingStock || !newStockSymbol.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {addingStock 
                  ? `Adding... (${bulkAddResults?.added?.length || 0} added)` 
                  : bulkAddResults?.added?.length > 0 
                    ? 'Add More' 
                    : 'Add Stock(s)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

