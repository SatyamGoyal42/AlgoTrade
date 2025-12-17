import os
import yaml
import pandas as pd
from datetime import datetime
from database.config import db
from database.models.stockListAndItemModel import StockList, StockItem

BACKTEST_ALGOS = {}


def register_backtest_algo(algo_name: str, backtest_func):
    BACKTEST_ALGOS[algo_name] = backtest_func


def get_backtest_algo_func(algo_name: str):
    if algo_name not in BACKTEST_ALGOS:
        raise ValueError(f"Backtest function not found for algorithm: {algo_name}. Please ensure the backtest file for {algo_name} exists and registers the function.")
    return BACKTEST_ALGOS[algo_name]


def backtest_algo_on_symbol(symbol: str, algo_name: str, algo_params: dict):
    """
    Backtests the specified algorithm on a single stock symbol.
    Returns backtest results including performance metrics.
    
    Args:
        symbol: Stock symbol (without .NS suffix, will be added automatically)
        algo_name: Name of the algorithm to backtest
        algo_params: Parameters for the algorithm (period, interval, target_increase, auto_adjusted)
    
    Returns:
        Dictionary containing backtest results
    """
    backtest_func = get_backtest_algo_func(algo_name)

    try:
        raw_results = backtest_func(symbol + ".NS", algo_params)

        if not isinstance(raw_results, dict):
            raise ValueError(
                f"Backtest function for {algo_name} must return a dictionary, got {type(raw_results)}"
            )

        results = dict(raw_results)

        # Ensure expected metadata is always present for the frontend
        results["symbol"] = results.get("symbol", symbol)
        results["algo_name"] = algo_name
        results["algo_params"] = algo_params
        results.setdefault("success", "error" not in results)

        if results.get("error"):
            results["success"] = False

        return results

    except Exception as e:
        return {
            "symbol": symbol,
            "algo_name": algo_name,
            "error": str(e),
            "success": False,
            "algo_params": algo_params
        }


def backtest_algo_on_list(stock_list_id: int, algo_name: str, algo_params: dict):
    """
    Backtests the specified algorithm on every stock in a stock list.
    Returns combined backtest results for all symbols.
    
    Args:
        stock_list_id: ID of the stock list to backtest on
        algo_name: Name of the algorithm to backtest
        algo_params: Parameters for the algorithm (period, interval, target_increase, auto_adjusted)
    
    Returns:
        Dictionary containing combined backtest results
    """
    stock_list = StockList.query.get(stock_list_id)
    if not stock_list:
        raise ValueError(f"StockList with id={stock_list_id} not found.")

    symbols = [item.symbol for item in stock_list.stocks]
    all_results = []
    successful_backtests = 0
    failed_backtests = 0

    for symbol in symbols:
        print(f"Backtesting {algo_name} on {symbol}...")
        symbol_results = backtest_algo_on_symbol(symbol, algo_name, algo_params)

        if symbol_results.get("success", True) and "error" not in symbol_results:
            successful_backtests += 1
        else:
            failed_backtests += 1

        all_results.append(symbol_results)

    # Calculate portfolio averages from stocks with at least one trade
    stocks_with_trades = [
        result for result in all_results 
        if result.get("success", False) and result.get("num_trades", 0) > 0
    ]
    
    num_stocks_with_trades = len(stocks_with_trades)
    
    portfolio_averages = {}
    if num_stocks_with_trades > 0:
        # Calculate averages for stocks with at least one trade
        portfolio_averages = {
            "avg_portfolio_returns": float(sum(r.get("average_trade_return", 0) for r in stocks_with_trades) / num_stocks_with_trades),
            "avg_portfolio_cagr": float(sum(r.get("cagr", 0) for r in stocks_with_trades) / num_stocks_with_trades),
            "avg_portfolio_sharpe": float(sum(r.get("sharpe_ratio", 0) for r in stocks_with_trades) / num_stocks_with_trades),
            "avg_total_return": float(sum(r.get("total_return", 0) for r in stocks_with_trades) / num_stocks_with_trades),
            "avg_winrate": float(sum(r.get("win_rate", 0) for r in stocks_with_trades) / num_stocks_with_trades),
            "avg_days_held": float(sum(r.get("avg_days_held", 0) for r in stocks_with_trades) / num_stocks_with_trades)
        }
    else:
        # If no stocks have trades, set all averages to 0
        portfolio_averages = {
            "avg_portfolio_returns": 0.0,
            "avg_portfolio_cagr": 0.0,
            "avg_portfolio_sharpe": 0.0,
            "avg_total_return": 0.0,
            "avg_winrate": 0.0,
            "avg_days_held": 0.0
        }
    
    combined_results = {
        "stock_list_id": stock_list_id,
        "algo_name": algo_name,
        "total_symbols": len(symbols),
        "successful_backtests": successful_backtests,
        "failed_backtests": failed_backtests,
        "num_stocks_with_trades": num_stocks_with_trades,
        "symbol_results": all_results,
        "portfolio_averages": portfolio_averages,
        "algo_params": algo_params,
        "success": failed_backtests == 0
    }
    
    return combined_results


