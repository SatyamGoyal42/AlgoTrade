import numpy as np
import pandas as pd
from typing import List, Tuple
import yfinance as yf
from scipy.signal import find_peaks



def detect_resistances(
    df: pd.DataFrame,
    window: int = 200,
    n_levels: int = 5,
    epsilon: float = 0.003,        # tolerance fraction (0.3%)
    lambda_penalty: float = 1.5,  # penalty for breaks
    min_touches: int = 4,
    max_break_ratio: float = 0.05,
    min_sep: int = 3,             # minimum bars between counted touches
    hl_bars: float = 40,          # half-life for recency weighting (in bars)
    levels_bins: int = 200
) -> List[Tuple[float, float, float, int]]:
    """
    Returns top n_levels resistance candidates as list of tuples:
      (level_price, score, weighted_touch_count, raw_break_count)
    """
    # Handle multi-indexed columns from yfinance
    df = df.copy()
    if isinstance(df.columns, pd.MultiIndex):
        # Flatten multi-index columns: ('High', 'AAPL') -> 'High'
        df.columns = df.columns.get_level_values(0)
    
    # Normalize column names: handle both 'High'/'high' and 'Close'/'close'
    column_mapping = {}
    has_close = False
    for col in df.columns:
        col_lower = str(col).lower()
        if col_lower == 'close':
            column_mapping[col] = 'close'
            has_close = True
        elif col_lower in ['high', 'low', 'open', 'volume']:
            column_mapping[col] = col_lower
        elif col_lower == 'adj close' and not has_close:
            # Only use adj close if regular close doesn't exist
            column_mapping[col] = 'close'
            has_close = True
    
    # Rename columns to lowercase for consistent access
    df = df.rename(columns=column_mapping)
    
    # If 'high' or 'close' columns are still DataFrames (multi-index case), extract the first column
    for col_name in ['high', 'close']:
        if col_name in df.columns:
            if isinstance(df[col_name], pd.DataFrame):
                # If it's a DataFrame, take the first column
                df[col_name] = df[col_name].iloc[:, 0]
    
    # Ensure we have the required columns
    if 'high' not in df.columns or 'close' not in df.columns:
        raise ValueError(f"df must have 'high' and 'close' columns. Found columns: {list(df.columns)}")
    
    if len(df) < 2:
        return []

    # take last 'window' candles
    dfw = df.iloc[-window:].copy().reset_index(drop=True)
    
    # Extract numpy arrays, handling both Series and single-column DataFrame
    high_col = dfw['high']
    close_col = dfw['close']
    
    if isinstance(high_col, pd.DataFrame):
        highs = high_col.iloc[:, 0].to_numpy()
    else:
        highs = high_col.to_numpy()
    
    if isinstance(close_col, pd.DataFrame):
        closes = close_col.iloc[:, 0].to_numpy()
    else:
        closes = close_col.to_numpy()
    N = len(dfw)
    times = np.arange(N)  # 0..N-1 (oldest->newest)

    # recency weights: exponential decay with half-life hl_bars
    alpha = np.log(2) / max(1.0, hl_bars)
    weights = np.exp(-alpha * (N - 1 - times))  # more recent (higher index) -> bigger weight

    # candidate levels: linspace between min(highs) and max(highs)
    low = float(np.nanmin(highs))
    high = float(np.nanmax(highs))
    if low == high:
        return []
    candidate_levels = np.linspace(low, high, levels_bins)

    results = []
    for r in candidate_levels:
        tol = epsilon * r
        # indices where high is within tolerance
        touch_idx = np.where(np.abs(highs - r) <= tol)[0]
        if touch_idx.size == 0:
            continue

        # enforce separation: pick touches spaced by at least min_sep bars
        if min_sep > 1:
            kept = []
            last = -1_000_000
            for idx in touch_idx:
                if idx - last >= min_sep:
                    kept.append(idx)
                    last = idx
            touch_idx = np.array(kept, dtype=int)

        # weighted touch count (recency weights)
        T = float(weights[touch_idx].sum()) if touch_idx.size > 0 else 0.0
        raw_touches = int(touch_idx.size)

        # break count: closes strictly > r (we count raw and weighted)
        break_idx = np.where(closes > r)[0]
        B_raw = int(break_idx.size)
        B_weighted = float(weights[break_idx].sum()) if break_idx.size > 0 else 0.0

        # normalized break ratio (weighted)
        total_weight = float(weights.sum())
        break_ratio = B_weighted / total_weight if total_weight > 0 else 0.0

        # score: weighted touches minus penalty * weighted breaks
        score = T - lambda_penalty * B_weighted

        # constraints
        if raw_touches < min_touches:
            continue
        if break_ratio > max_break_ratio:
            continue

        results.append((r, score, T, B_raw))

    # sort by score descending, return top n_levels
    results.sort(key=lambda x: x[1], reverse=True)
    return results[:n_levels]


def find_sma_maxima(df: pd.DataFrame, sma_col: str = 'sma10', min_prominence: float = 0.005):
    """
    Identify local maxima in SMA series.
    min_prominence = minimum relative rise required to qualify as maxima (default = 0.5%)
    """
    df = df.copy()
    df['prev'] = df[sma_col].shift(1)
    df['next'] = df[sma_col].shift(-1)
    condition = (df[sma_col] > df['prev']) & (df[sma_col] > df['next'])
    
    # Optional: prominence filter (remove minor bumps)
    df['diff_prev'] = df[sma_col] - df['prev']
    df['diff_next'] = df[sma_col] - df['next']
    df['prominence'] = (df['diff_prev'] + df['diff_next']) / df[sma_col]
    condition &= (df['prominence'] >= min_prominence)
    
    maxima_dates = df.loc[condition].index
    return list(maxima_dates)


def compute_resistances_for_sma_maxima(symbol="TCS.NS", n_levels=3):
    # --- Fetch 5 years of data ---
    df = yf.download(symbol, period="5y", interval="1d", auto_adjust=True)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df.rename(columns=str.lower)

    # --- Compute SMA10 ---
    df['sma10'] = df['close'].rolling(10).mean()

    # --- Find SMA maxima ---
    peaks, _ = find_peaks(df['sma10'], distance=10, prominence=0.005)
    maxima_dates = df.index[peaks]

    print(f"Found {len(maxima_dates)} SMA maxima in 5 years.\n")

    # --- For each maxima, compute resistances up to that date ---
    results = []
    for maxima_date in maxima_dates:
        start_date = df.index[0]
        end_date = maxima_date
        df_window = df.loc[start_date:end_date]
        if len(df_window) < 30:  # skip too-small windows
            continue
        res = detect_resistances(df_window, window=len(df_window), n_levels=n_levels)
        for (level, score, touches, breaks) in res:
            results.append({
                'maxima_date': maxima_date,
                'resistance_level': round(level, 2),
                'score': round(score, 3),
                'touches': round(touches, 2),
                'breaks': breaks
            })

    # --- Convert to DataFrame ---
    result_df = pd.DataFrame(results)
    return result_df


if __name__ == "__main__":
    symbol = "LT.NS"
    resistances_df = compute_resistances_for_sma_maxima(symbol, n_levels=1)
    print("\nMulti-zone Resistance Levels (SMA maxima anchored):\n")
    print(resistances_df.head(20))