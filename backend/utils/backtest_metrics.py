"""
Utility functions for calculating backtest metrics.

This module provides reusable functions for calculating common backtest metrics
like Sharpe ratio, CAGR, drawdowns, win rates, etc. These can be used across
different backtest algorithms.
"""

import pandas as pd
import numpy as np


def calculate_backtest_metrics(trades, price_data):
    """
    Calculate comprehensive backtest metrics from trades and price data.
    
    Args:
        trades: List of trade dictionaries. Each trade should have:
            - 'buy_date': Entry date (string or datetime)
            - 'sell_date': Exit date (string or datetime)
            - 'buy_price': Entry price (float)
            - 'sell_price': Exit price (float)
            - 'gain_%': Return percentage (float)
            - 'days_held': Number of days held (int)
        price_data: DataFrame with price data indexed by date. Should have 'Close' column.
    
    Returns:
        Dictionary containing:
            - total_return: Total return percentage
            - cagr: Compound Annual Growth Rate percentage
            - win_rate: Win rate percentage
            - sharpe_ratio: Sharpe ratio
            - max_drawdown: Maximum drawdown percentage
            - average_trade_return: Average trade return percentage
            - avg_win: Average winning trade return percentage
            - avg_loss: Average losing trade return percentage
            - profit_factor: Profit factor (total wins / total losses)
            - buy_hold_return: Buy and hold return percentage
            - avg_days_held: Average days held
            - equity_curve: List of equity curve points with 'date' and 'equity' keys
    """
    if not trades:
        return {
            'total_return': 0.0,
            'cagr': 0.0,
            'win_rate': 0.0,
            'sharpe_ratio': 0.0,
            'max_drawdown': 0.0,
            'average_trade_return': 0.0,
            'avg_win': 0.0,
            'avg_loss': 0.0,
            'profit_factor': 0.0,
            'buy_hold_return': 0.0,
            'avg_days_held': 0.0,
            'equity_curve': []
        }
    
    # Convert trades to DataFrame for easier manipulation
    df_trades = pd.DataFrame(trades)
    returns = df_trades['gain_%'].to_numpy()
    
    # Build equity curve
    equity_df = pd.DataFrame(index=pd.to_datetime(price_data.index))
    equity_df['equity'] = np.nan
    
    # Prepare trade details for equity curve calculation
    trade_details = []
    for trade in trades:
        trade_details.append({
            'buy_date': pd.to_datetime(trade['buy_date']),
            'sell_date': pd.to_datetime(trade['sell_date']),
            'buy_price': trade['buy_price'],
            'sell_price': trade['sell_price']
        })
    
    trade_details.sort(key=lambda t: t['buy_date'])
    
    # Calculate equity curve
    current_equity = 1.0
    trade_idx = 0
    active_trade = None
    entry_equity = None
    entry_price = None
    
    for date in equity_df.index:
        date_ts = date if isinstance(date, pd.Timestamp) else pd.to_datetime(date)
        
        if active_trade is None and trade_idx < len(trade_details):
            next_trade = trade_details[trade_idx]
            if date_ts >= next_trade['buy_date']:
                active_trade = next_trade
                entry_equity = current_equity
                entry_price = next_trade['buy_price']
        
        if active_trade is not None:
            buy_date = active_trade['buy_date']
            sell_date = active_trade['sell_date']
            sell_price = active_trade['sell_price']
            
            if date_ts == buy_date:
                equity_today = entry_equity
            elif date_ts < sell_date:
                price_today = price_data.loc[date_ts, 'Close'] if date_ts in price_data.index else None
                if price_today is None:
                    prev_idx = price_data.index.get_indexer([date_ts], method='pad')
                    if prev_idx.size == 0 or prev_idx[0] == -1:
                        price_today = entry_price
                    else:
                        price_today = price_data.iloc[prev_idx[0]]['Close']
                equity_today = entry_equity * (price_today / entry_price)
            else:
                current_equity = entry_equity * (sell_price / entry_price)
                equity_today = current_equity
                trade_idx += 1
                active_trade = None
                entry_equity = None
                entry_price = None
                
                if trade_idx < len(trade_details):
                    next_trade = trade_details[trade_idx]
                    if date_ts >= next_trade['buy_date']:
                        active_trade = next_trade
                        entry_equity = current_equity
                        entry_price = next_trade['buy_price']
                        if date_ts == next_trade['buy_date']:
                            equity_today = current_equity
        else:
            equity_today = current_equity
        
        equity_df.loc[date_ts, 'equity'] = equity_today
    
    equity_df['equity'] = equity_df['equity'].ffill().fillna(1.0)
    equity_df['daily_return'] = equity_df['equity'].pct_change().fillna(0)
    
    # Calculate Sharpe ratio
    daily_returns = equity_df['daily_return']
    if daily_returns.std() > 0:
        sharpe = (daily_returns.mean() / daily_returns.std()) * np.sqrt(252)
    else:
        sharpe = 0.0
    
    # Format equity curve
    equity_curve_series = equity_df['equity'].reset_index()
    equity_curve_series.columns = ['date', 'equity']
    equity_curve = equity_curve_series['equity'].to_numpy()
    equity_curve_points = [
        {
            'date': timestamp.strftime('%Y-%m-%d'),
            'equity': float(value)
        }
        for timestamp, value in zip(equity_curve_series['date'], equity_curve_series['equity'])
    ]
    
    # Calculate basic metrics
    total_return = (equity_curve[-1] - 1) * 100 if len(equity_curve) > 0 else 0
    avg_return = np.mean(returns)
    win_rate = np.mean(returns > 0) * 100
    
    # Calculate drawdowns
    drawdowns = 1 - equity_curve / np.maximum.accumulate(equity_curve)
    max_dd = np.max(drawdowns) * 100
    
    # Calculate CAGR
    start_date = pd.to_datetime(price_data.index[0])
    end_date = pd.to_datetime(price_data.index[-1])
    years = (end_date - start_date).days / 365.25
    final_equity = equity_curve[-1] if len(equity_curve) > 0 else 1
    CAGR = ((final_equity) ** (1 / years) - 1) * 100 if years > 0 else 0
    
    # Calculate win/loss metrics
    winning_trades = returns[returns > 0]
    losing_trades = returns[returns < 0]
    avg_win = np.mean(winning_trades) if len(winning_trades) > 0 else 0
    avg_loss = np.mean(losing_trades) if len(losing_trades) > 0 else 0
    
    total_wins = np.sum(winning_trades) if len(winning_trades) > 0 else 0
    total_losses = abs(np.sum(losing_trades)) if len(losing_trades) > 0 else 1
    profit_factor = total_wins / total_losses if total_losses > 0 else 0
    
    # Calculate buy and hold return
    closes = price_data['Close'].values
    buy_hold_return = ((closes[-1] - closes[0]) / closes[0]) * 100
    
    # Calculate average days held
    avg_days_held = np.mean([t['days_held'] for t in trades]) if trades else 0
    
    return {
        'total_return': float(total_return),
        'cagr': float(CAGR),
        'win_rate': float(win_rate),
        'sharpe_ratio': float(sharpe),
        'max_drawdown': float(max_dd),
        'average_trade_return': float(avg_return),
        'avg_win': float(avg_win),
        'avg_loss': float(avg_loss),
        'profit_factor': float(profit_factor),
        'buy_hold_return': float(buy_hold_return),
        'avg_days_held': float(avg_days_held),
        'equity_curve': equity_curve_points
    }

