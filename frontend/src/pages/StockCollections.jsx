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
    <div className="min-h-screen bg-gray-200 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Stock Collections</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-xp"
        >
          + Create New List
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-200 border-2 border-black text-black px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="font-semibold hover:text-red-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="border-2 border-black bg-gray-300 px-4 py-3 flex items-center justify-between text-black">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="font-semibold hover:opacity-80 text-black"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Lists Sidebar */}
        <div className="bg-white p-4 border-2 border-black" style={{ boxShadow: '2px 2px 0px #000' }}>
          <h2 className="text-xl font-semibold mb-4 text-black">Stock Lists</h2>
          
          {loading ? (
            <p className="text-black">Loading...</p>
          ) : stockLists.length === 0 ? (
            <p className="text-black">No stock lists found. Create one to get started!</p>
          ) : (
            <div className="space-y-2">
              {stockLists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => handleSelectList(list.id)}
                  className={`p-3 cursor-pointer border-2 border-black ${
                    selectedList?.id === list.id
                      ? 'bg-gray-300'
                      : 'bg-white hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-black">{list.name}</h3>
                      <p className="text-sm text-black">
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
                        className="text-black hover:text-black text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                        className="text-black hover:text-black text-sm"
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
        <div className="lg:col-span-2 bg-white p-4 border-2 border-black" style={{ boxShadow: '2px 2px 0px #000' }}>
          {selectedList ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-black">{selectedList.name}</h2>
                <button
                  onClick={() => {
                    setError(null);
                    setShowAddStockModal(true);
                  }}
                  className="btn-xp text-sm flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Add Stock</span>
                </button>
              </div>

              {selectedList.stocks && selectedList.stocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-2 border-black">
                    <thead className="bg-gray-300 border-2 border-black">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-black border-r-2 border-black">
                          Symbol
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-black">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {selectedList.stocks.map((symbol, idx) => (
                        <tr key={idx} className="border-b-2 border-black hover:bg-gray-200">
                          <td className="px-4 py-2 whitespace-nowrap text-xs font-bold text-black border-r-2 border-black">
                            {symbol}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs">
                            <button
                              onClick={() => handleRemoveStock(symbol)}
                              className="btn-xp text-xs"
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
                <div className="bg-gray-300 border-2 border-black p-4 text-center">
                  <p className="text-black font-bold">No stocks in this list. Add some stocks to get started!</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-black py-12 bg-gray-300 border-2 border-black">
              <p className="font-bold">Select a stock list from the sidebar to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 border-4 border-black w-96" style={{ boxShadow: '4px 4px 0px #000' }}>
            <h3 className="text-lg font-bold mb-4 text-black">Create New Stock List</h3>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name..."
              className="input-xp w-full px-4 py-2 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                }}
                className="btn-xp"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                className="btn-xp"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white p-6 border-4 border-black w-full max-w-md" style={{ boxShadow: '4px 4px 0px #000' }}>
            <h3 className="text-lg font-bold mb-2 text-black">Add Stock(s) to List</h3>
            <p className="text-sm text-black mb-4">
              {selectedList?.name}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-black mb-2">
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
                className="input-xp w-full px-4 py-2 min-h-[100px] resize-y"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !addingStock) {
                    handleAddStock();
                  }
                }}
                autoFocus
                disabled={addingStock}
              />
              <p className="text-xs text-black mt-1">
                Separate multiple stocks with commas or spaces. Press Ctrl+Enter to add.
              </p>
            </div>

            {/* Bulk Add Results */}
            {bulkAddResults && (
              <div className="mb-4 space-y-2">
                {bulkAddResults.added && bulkAddResults.added.length > 0 && (
                  <div className="border-2 border-black bg-gray-300 p-3">
                    <p className="text-sm font-bold mb-1 text-black">
                      ✓ Successfully Added ({bulkAddResults.added.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bulkAddResults.added.map((symbol) => (
                        <span
                          key={symbol}
                          className="text-xs px-2 py-1 border border-black bg-gray-300 text-black font-bold"
                        >
                          {symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {bulkAddResults.duplicates && bulkAddResults.duplicates.length > 0 && (
                  <div className="bg-yellow-200 border-2 border-black p-3">
                    <p className="text-sm font-semibold text-black mb-1">
                      ⚠ Already in List ({bulkAddResults.duplicates.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {bulkAddResults.duplicates.map((symbol) => (
                        <span
                          key={symbol}
                          className="text-xs bg-yellow-300 text-black px-2 py-1 border border-black font-bold"
                        >
                          {symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {bulkAddResults.failed && bulkAddResults.failed.length > 0 && (
                  <div className="bg-red-200 border-2 border-black p-3">
                    <p className="text-sm font-semibold text-black mb-1">
                      ✗ Failed ({bulkAddResults.failed.length})
                    </p>
                    <div className="space-y-1">
                      {bulkAddResults.failed.map((item, idx) => (
                        <div key={idx} className="text-xs text-black">
                          <span className="font-medium">{item.symbol}:</span> {item.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-black mb-2">{error}</p>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowAddStockModal(false);
                  setNewStockSymbol('');
                  setError(null);
                  setBulkAddResults(null);
                }}
                className="btn-xp disabled:opacity-50"
                disabled={addingStock}
              >
                {bulkAddResults && bulkAddResults.added && bulkAddResults.added.length > 0 ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={handleAddStock}
                disabled={addingStock || !newStockSymbol.trim()}
                className="btn-xp disabled:opacity-50"
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

