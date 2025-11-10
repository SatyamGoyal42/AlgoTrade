"""
Backtesting Strategy Module

This module contains the SMA-based trading strategy backtesting functionality.
The strategy uses Moving Average alignment to generate buy/sell signals.

Strategy Rules:
- BUY: close < sma_20 < sma_50 < sma_200 (only if not in position)
- SELL: close > sma_20 > sma_50 > sma_200 (only if in position)
- Position Management: Can only hold ONE position at a time
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import precision_score, recall_score, accuracy_score, f1_score, confusion_matrix


def backtest_strategy(y_actual, current_prices, sma_20, sma_50, sma_200):
    """
    Backtest a trading strategy based on Moving Average alignment.
    
    Strategy Rules:
    - BUY Signal: close < sma_20 < sma_50 < sma_200
      (Price below all SMAs, SMAs in descending order - potential upward reversal)
      Only executes if not already in a position
    - SELL Signal: close > sma_20 > sma_50 > sma_200
      (Price above all SMAs, SMAs in ascending order - potential downward reversal)
      Only executes if currently in a position
    - HOLD: All other conditions (no clear trend)
    
    Position Management:
    - Can only hold ONE position at a time
    - Must sell before buying again
    - Returns calculated from entry to exit price
    
    Parameters:
    -----------
    y_actual : array-like
        Actual future prices (what actually happened next day)
    current_prices : array-like
        Current closing prices at prediction time
    sma_20 : array-like
        20-day Simple Moving Average values
    sma_50 : array-like
        50-day Simple Moving Average values
    sma_200 : array-like
        200-day Simple Moving Average values
    
    Returns:
    --------
    dict
        Dictionary with trading performance metrics including:
        - Classification metrics (precision, recall, accuracy, f1_score)
        - Confusion matrix components
        - Trading performance (returns, win rate, profit factor, etc.)
        - Signal arrays (buy_signals, sell_signals)
        - Returns arrays (returns, cumulative_returns, trade_returns)
    """
    # Convert to numpy arrays for easier calculations
    y_actual = np.array(y_actual)
    current_prices = np.array(current_prices)
    sma_20 = np.array(sma_20)
    sma_50 = np.array(sma_50)
    sma_200 = np.array(sma_200)
    
    # Calculate actual price change: (next_day_price - current_price) / current_price * 100
    actual_change = ((y_actual - current_prices) / current_prices) * 100
    
    # ------------------------------------------------------------------------
    # GENERATE TRADING SIGNALS BASED ON SMA ALIGNMENT
    # ------------------------------------------------------------------------
    # BUY Signal: close < sma_20 < sma_50 < sma_200
    # All conditions must be true:
    #   1. close < sma_20 (price below short-term MA)
    #   2. sma_20 < sma_50 (short-term below medium-term)
    #   3. sma_50 < sma_200 (medium-term below long-term)
    # This indicates price is oversold and may reverse upward
    buy_condition = (
        (current_prices < sma_20) &  # Price below 20-day SMA
        (sma_20 < sma_50) &          # 20-day SMA below 50-day SMA
        (sma_50 < sma_200)           # 50-day SMA below 200-day SMA
    )
    
    # SELL Signal: close > sma_20 > sma_50 > sma_200
    # All conditions must be true:
    #   1. close > sma_20 (price above short-term MA)
    #   2. sma_20 > sma_50 (short-term above medium-term)
    #   3. sma_50 > sma_200 (medium-term above long-term)
    # This indicates price is overbought and may reverse downward
    sell_condition = (
        (current_prices > sma_20) &  # Price above 20-day SMA
        (sma_20 > sma_50) &          # 20-day SMA above 50-day SMA
        (sma_50 > sma_200)           # 50-day SMA above 200-day SMA
    )
    
    # ------------------------------------------------------------------------
    # IMPLEMENT POSITION TRACKING - ONE POSITION AT A TIME
    # ------------------------------------------------------------------------
    # We can only hold one position at a time
    # - Can only BUY if we don't have a position (not in position)
    # - Can only SELL if we have a position (in position)
    # - Track position state throughout the backtest
    
    in_position = False  # Track if we currently hold a position
    entry_price = None   # Price at which we entered the position
    entry_index = None   # Index where we entered
    
    # Arrays to track trades and returns
    buy_signals = np.zeros(len(current_prices), dtype=int)  # 1 = Buy executed, 0 = No buy
    sell_signals = np.zeros(len(current_prices), dtype=int)  # 1 = Sell executed, 0 = No sell
    returns = np.zeros(len(current_prices))  # Returns for each day
    trade_returns = []  # List to store completed trade returns
    
    # Iterate through each day to simulate trading
    for i in range(len(current_prices)):
        # Check if buy condition is met AND we don't have a position
        if buy_condition[i] and not in_position:
            # Execute BUY
            buy_signals[i] = 1
            in_position = True
            entry_price = current_prices[i]
            entry_index = i
            # No return on buy day - we enter at closing price
        
        # Check if sell condition is met AND we have a position
        elif sell_condition[i] and in_position:
            # Execute SELL
            sell_signals[i] = 1
            # Calculate return for this completed trade (entry to exit)
            # Return = (exit_price - entry_price) / entry_price * 100
            exit_price = current_prices[i]
            trade_return = ((exit_price - entry_price) / entry_price) * 100
            trade_returns.append(trade_return)
            
            # Calculate daily returns while holding the position
            # actual_change[j] = change from day j to day j+1
            # So if we hold from day entry_index to day i:
            # - Day entry_index: return = 0 (we buy at close)
            # - Day entry_index+1: return = actual_change[entry_index] (change from entry to next day)
            # - Day entry_index+2: return = actual_change[entry_index+1]
            # - ...
            # - Day i: return = actual_change[i-1] (change from day i-1 to day i, which is exit day)
            if entry_index is not None:
                # Entry day: return = 0 (we buy at closing price)
                returns[entry_index] = 0
                # Days after entry: track daily price changes
                for j in range(entry_index + 1, i + 1):
                    if j-1 < len(actual_change):
                        # Return on day j is the change from day j-1 to day j
                        returns[j] = actual_change[j-1]
            
            # Reset position
            in_position = False
            entry_price = None
            entry_index = None
        
        # If we're in position but no sell signal, we're holding
        # Track daily return based on price change
        elif in_position:
            if i == entry_index:
                # Entry day: return = 0 (we buy at closing price)
                returns[i] = 0
            elif i > entry_index:
                # Days after entry: return = price change from previous day
                # actual_change[i-1] is the change from day i-1 to day i
                if i-1 < len(actual_change):
                    returns[i] = actual_change[i-1]
    
    # If we're still in position at the end, close it at the last price
    if in_position and entry_price is not None:
        final_price = current_prices[-1]
        final_return = ((final_price - entry_price) / entry_price) * 100
        trade_returns.append(final_return)
        # Add returns for remaining days we held
        if entry_index is not None:
            # Entry day: return = 0
            if entry_index < len(returns):
                returns[entry_index] = 0
            # Days after entry: track daily price changes
            for j in range(entry_index + 1, len(returns)):
                if j-1 < len(actual_change):
                    # Return on day j is the change from day j-1 to day j
                    returns[j] = actual_change[j-1]
    
    # ------------------------------------------------------------------------
    # CALCULATE TRADING METRICS
    # ------------------------------------------------------------------------
    # Actual price movements: 1 = Price increased, 0 = Price decreased
    actual_movements = (actual_change > 0).astype(int)
    
    # Classification metrics: Compare buy signals with actual price movements
    # Note: We compare buy signals with next day's price movement
    precision = precision_score(actual_movements, buy_signals, zero_division=0)
    recall = recall_score(actual_movements, buy_signals, zero_division=0)
    accuracy = accuracy_score(actual_movements, buy_signals)
    f1 = f1_score(actual_movements, buy_signals, zero_division=0)
    
    # Confusion matrix
    cm = confusion_matrix(actual_movements, buy_signals)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)
    
    # Trading performance metrics
    num_buys = np.sum(buy_signals)
    num_sells = np.sum(sell_signals)
    num_trades = min(num_buys, num_sells)  # Number of completed trades (buy-sell pairs)
    
    # Calculate returns from completed trades
    if len(trade_returns) > 0:
        total_return = np.sum(trade_returns)
        avg_return_per_trade = np.mean(trade_returns)
        
        # Win rate: Percentage of profitable completed trades
        winning_trades = [r for r in trade_returns if r > 0]
        losing_trades = [r for r in trade_returns if r < 0]
        win_rate = len(winning_trades) / len(trade_returns) if len(trade_returns) > 0 else 0
        
        # Average win and loss
        avg_win = np.mean(winning_trades) if len(winning_trades) > 0 else 0
        avg_loss = np.mean(losing_trades) if len(losing_trades) > 0 else 0
        
        # Profit factor: Total wins / Total losses
        total_wins = np.sum(winning_trades) if len(winning_trades) > 0 else 0
        total_losses = abs(np.sum(losing_trades)) if len(losing_trades) > 0 else 1
        profit_factor = total_wins / total_losses if total_losses > 0 else 0
    else:
        total_return = 0
        avg_return_per_trade = 0
        win_rate = 0
        avg_win = 0
        avg_loss = 0
        profit_factor = 0
    
    return {
        'precision': precision,
        'recall': recall,
        'accuracy': accuracy,
        'f1_score': f1,
        'confusion_matrix': cm,
        'tn': tn, 'fp': fp, 'fn': fn, 'tp': tp,
        'total_return': total_return,
        'num_trades': num_trades,
        'num_buys': num_buys,
        'num_sells': num_sells,
        'avg_return_per_trade': avg_return_per_trade,
        'win_rate': win_rate,
        'avg_win': avg_win,
        'avg_loss': avg_loss,
        'profit_factor': profit_factor,
        'returns': returns,
        'buy_signals': buy_signals,
        'sell_signals': sell_signals,
        'trade_returns': trade_returns,
        'actual_change': actual_change,  # For Buy & Hold comparison
        'cumulative_returns': np.cumsum(returns)
    }


def print_backtest_results(results):
    """
    Print comprehensive backtest results in a formatted way.
    
    Parameters:
    -----------
    results : dict
        Results dictionary from backtest_strategy function
    """
    print("=" * 70)
    print("BACKTESTING RESULTS - SMA-BASED STRATEGY")
    print("=" * 70)
    print("\nStrategy Rules:")
    print("  BUY:  close < sma_20 < sma_50 < sma_200 (only if not in position)")
    print("  SELL: close > sma_20 > sma_50 > sma_200 (only if in position)")
    print("  HOLD: All other conditions")
    print("\nPosition Management:")
    print("  - Can only hold ONE position at a time")
    print("  - Must sell before buying again")
    print("  - Returns calculated from entry to exit price")
    print("=" * 70)
    
    print(f"\n📊 CLASSIFICATION METRICS:")
    print(f"  Precision:  {results['precision']:.4f} ({results['precision']*100:.2f}%)")
    print(f"  Recall:     {results['recall']:.4f} ({results['recall']*100:.2f}%)")
    print(f"  Accuracy:   {results['accuracy']:.4f} ({results['accuracy']*100:.2f}%)")
    print(f"  F1 Score:   {results['f1_score']:.4f}")
    
    print(f"\n📈 CONFUSION MATRIX:")
    print(f"  True Negatives (TN):  {results['tn']:3d}  |  False Positives (FP): {results['fp']:3d}")
    print(f"  False Negatives (FN): {results['fn']:3d}  |  True Positives (TP):   {results['tp']:3d}")
    
    print(f"\n💰 TRADING PERFORMANCE:")
    print(f"  Number of Buy Signals:     {results['num_buys']:3d}")
    print(f"  Number of Sell Signals:    {results['num_sells']:3d}")
    print(f"  Completed Trades:          {results['num_trades']:3d}")
    print(f"  Total Return:              {results['total_return']:8.2f}%")
    print(f"  Average Return per Trade:  {results['avg_return_per_trade']:8.2f}%")
    print(f"  Win Rate:                  {results['win_rate']:8.2%}")
    print(f"  Average Win:               {results['avg_win']:8.2f}%")
    print(f"  Average Loss:              {results['avg_loss']:8.2f}%")
    print(f"  Profit Factor:             {results['profit_factor']:8.2f}")


def plot_backtest_results(results, dates, title_suffix=""):
    """
    Create visualizations for backtest results.
    
    Parameters:
    -----------
    results : dict
        Results dictionary from backtest_strategy function
    dates : array-like
        Date index for plotting (e.g., y_test.index)
    title_suffix : str, optional
        Additional text to add to plot titles
    """
    # Visualize confusion matrix
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(results['confusion_matrix'], annot=True, fmt='d', cmap='Greens', ax=ax,
                xticklabels=['Hold/Sell', 'Buy'], yticklabels=['Price Down', 'Price Up'])
    ax.set_title(f'SMA Strategy - Confusion Matrix{title_suffix}\nPrecision: {results["precision"]:.3f}', 
                 fontsize=14, fontweight='bold')
    ax.set_ylabel('Actual Price Movement', fontsize=12)
    ax.set_xlabel('Trading Signal', fontsize=12)
    plt.tight_layout()
    plt.show()
    
    # Plot cumulative returns
    fig, ax = plt.subplots(figsize=(15, 6))
    ax.plot(dates, results['cumulative_returns'], 
            label='SMA Strategy Returns', linewidth=2, color='green')
    ax.plot(dates, np.cumsum(results['actual_change']), 
            label='Buy & Hold', linewidth=2, linestyle='--', alpha=0.7, color='blue')
    ax.set_title(f'Cumulative Returns: SMA Strategy vs Buy & Hold{title_suffix}', 
                 fontsize=14, fontweight='bold')
    ax.set_xlabel('Date', fontsize=12)
    ax.set_ylabel('Cumulative Return (%)', fontsize=12)
    ax.legend(fontsize=11)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()

