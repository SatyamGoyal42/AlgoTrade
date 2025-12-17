"""
Backtest script for v20 algorithm.

This module backtests the v20 algorithm and calculates:
- CAGR (Compound Annual Growth Rate)
- Win% (Win Percentage)
- Sharpe Ratio
- Max DrawDown
- Average Trade Returns
"""

import yfinance as yf
import pandas as pd
import numpy as np
from algos.v20 import v20_algo
from utils.backtest_metrics import calculate_backtest_metrics


def backtest_v20_algo(symbol, algo_params):
    try:
        data = yf.download(symbol, period=algo_params.get('period', '6mo'), interval=algo_params.get('interval', '1d'), auto_adjust=algo_params.get('auto_adjusted', True))
        
        if data.empty:
            return {
                'success': False,
                'error': f'No historical data found for {symbol}',
                'symbol': symbol.replace('.NS', '')
            }
        
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)
        data.columns = [col.capitalize() for col in data.columns]
        
        levels = v20_algo(symbol, period=algo_params.get('period', '6mo'), interval=algo_params.get('interval', '1d'), target_increase=algo_params.get('target_increase', 20), auto_adjusted=algo_params.get('auto_adjusted', True))
        
        if not levels:
            return {
                'success': True,
                'num_trades': 0,
                'total_return': 0,
                'cagr': 0,
                'win_rate': 0,
                'sharpe_ratio': 0,
                'max_drawdown': 0,
                'average_trade_return': 0,
                'symbol': symbol.replace('.NS', ''),
                'message': 'No LP/HP signals found',
                'trades': []
            }
        
        is_holding = False
        buy_price = sell_price = None
        buy_date = sell_date = None
        trades = []
        
        for date, row in data.iterrows():
            high = row['High']
            low = row['Low']
            
            if not is_holding:
                for level in levels:
                    lp_date, hp_date, lp_val, hp_val, perc_increase, _ = level
                    lp_date_pd = pd.to_datetime(lp_date) if isinstance(lp_date, str) else pd.Timestamp(lp_date)
                    hp_date_pd = pd.to_datetime(hp_date) if isinstance(hp_date, str) else pd.Timestamp(hp_date)
                    date_pd = pd.to_datetime(date) if not isinstance(date, pd.Timestamp) else date
                    
                    if hp_date_pd< date_pd and low <= lp_val <= high:
                        buy_price = lp_val
                        buy_date = date_pd
                        is_holding = True
                        sell_price = hp_val
                        break
            
            else:
                if high >= sell_price:
                    sell_date = date_pd = pd.to_datetime(date) if not isinstance(date, pd.Timestamp) else date
                    is_holding = False
                    gain = (sell_price - buy_price) / buy_price * 100
                    days_held = (sell_date - buy_date).days if buy_date else 0
                    
                    trades.append({
                        'buy_date': buy_date.strftime('%Y-%m-%d') if hasattr(buy_date, 'strftime') else str(buy_date),
                        'buy_price': float(buy_price),
                        'sell_date': sell_date.strftime('%Y-%m-%d') if hasattr(sell_date, 'strftime') else str(sell_date),
                        'sell_price': float(sell_price),
                        'gain_%': float(gain),
                        'days_held': int(days_held)
                    })
                    
                    buy_price = sell_price = buy_date = sell_date = None
        
        if not trades:
            return {
                'success': True,
                'num_trades': 0,
                'total_return': 0,
                'cagr': 0,
                'win_rate': 0,
                'sharpe_ratio': 0,
                'max_drawdown': 0,
                'average_trade_return': 0,
                'equity_curve': [],
                'symbol': symbol.replace('.NS', ''),
                'message': 'No trades executed in this period',
                'trades': []
            }
        
        # Calculate metrics using reusable utility function
        metrics = calculate_backtest_metrics(trades, data)
        
        formatted_trades = []
        for trade in trades:
            formatted_trades.append({
                'entry_date': trade['buy_date'],
                'exit_date': trade['sell_date'],
                'entry_price': trade['buy_price'],
                'exit_price': trade['sell_price'],
                'return_pct': trade['gain_%'] / 100,
                'days_held': trade['days_held']
            })
        
        return {
            'success': True,
            'symbol': symbol.replace('.NS', ''),
            'num_trades': len(trades),
            'total_return': metrics['total_return'],
            'cagr': metrics['cagr'],
            'win_rate': metrics['win_rate'],
            'sharpe_ratio': metrics['sharpe_ratio'],
            'max_drawdown': metrics['max_drawdown'],
            'average_trade_return': metrics['average_trade_return'],
            'avg_win': metrics['avg_win'],
            'avg_loss': metrics['avg_loss'],
            'profit_factor': metrics['profit_factor'],
            'buy_hold_return': metrics['buy_hold_return'],
            'avg_days_held': metrics['avg_days_held'],
            'equity_curve': metrics['equity_curve'],
            'trades': formatted_trades
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Error in backtest: {str(e)}',
            'symbol': symbol.replace('.NS', '')
        }

    
# Register with backtester service
from services.backtester import register_backtest_algo
register_backtest_algo("v20", backtest_v20_algo)

