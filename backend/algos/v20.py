import time
import yfinance as yf
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
from collections.abc import Iterable


def _resolve_max_workers(requested, default_cap=5):
    if requested is not None:
        return max(1, requested)
    return default_cap


def _extract_series(df, column, symbol):
    """
    Handles both single-level and MultiIndex columns returned by yfinance.
    Returns a pandas Series for the requested column/symbol combination.
    """
    if column not in df:
        raise KeyError(f"Column '{column}' not found in data for {symbol}")

    series_or_df = df[column]
    if isinstance(series_or_df, pd.DataFrame):
        if symbol in series_or_df.columns:
            return series_or_df[symbol]

        stripped_symbol = symbol.replace(".NS", "")
        if stripped_symbol in series_or_df.columns:
            return series_or_df[stripped_symbol]

        if not series_or_df.columns.empty:
            return series_or_df.iloc[:, 0]
        raise KeyError(f"No columns available in '{column}' for {symbol}")

    return series_or_df


def _download_with_retry(symbol, period, interval, auto_adjusted, max_retries=3, retry_delay=0.5):
    last_df = pd.DataFrame()
    for attempt in range(max_retries):
        df = yf.download(symbol, period=period, interval=interval, auto_adjust=auto_adjusted, progress=False, threads=False)
        if not df.empty:
            return df
        last_df = df
        if attempt < max_retries - 1:
            time.sleep(retry_delay)
    return last_df


def _run_v20_for_symbol(symbol, period="6mo", interval="1d", target_increase=20, auto_adjusted=True):
    data = _download_with_retry(symbol, period=period, interval=interval, auto_adjusted=auto_adjusted)
    if data.empty:
        return []

    present = _download_with_retry(symbol, period="1d", interval="1d", auto_adjusted=auto_adjusted)
    if present.empty:
        return []

    close_series = _extract_series(data, "Close", symbol)
    open_series = _extract_series(data, "Open", symbol)
    data["Green"] = close_series >= open_series

    high_series = _extract_series(data, "High", symbol)
    low_series = _extract_series(data, "Low", symbol)

    present_close = _extract_series(present, "Close", symbol)
    if present_close.empty:
        return []

    results = []
    i = 0
    n = len(data)

    while i < n:
        if bool(data["Green"].iloc[i]):
            start_idx = i
            while i < n and bool(data["Green"].iloc[i]):
                i += 1
            end_idx = i - 1

            group_slice = slice(start_idx, end_idx + 1)
            group_low = low_series.iloc[group_slice]
            group_high = high_series.iloc[group_slice]

            LP = group_low.min()
            HP = group_high.max()

            if pd.isna(LP) or pd.isna(HP) or LP == 0:
                continue

            perc_increase = ((HP - LP) / LP) * 100

            current_close = present_close.iloc[-1]
            if pd.isna(current_close):
                continue

            percentage_from_LP_to_present = ((current_close - LP) / LP) * 100

            if perc_increase >= target_increase:
                print(data.iloc[group_slice])
                print("--------LP and HP--------")
                LP_date = group_low.idxmin().date()
                HP_date = group_high.idxmax().date()
                results.append((LP_date, HP_date, float(LP), float(HP), float(perc_increase), float(percentage_from_LP_to_present)))
        else:
            i += 1

    return results


def v20_algo(symbol, period="6mo", interval="1d", target_increase=20, auto_adjusted=True):
    """
    Run the v20 algorithm for a single symbol (existing behaviour).
    """
    if isinstance(symbol, (list, tuple, set)):
        raise TypeError("Pass a single symbol string to v20_algo. Use v20_algo_threaded for multiple symbols.")
    return _run_v20_for_symbol(symbol, period, interval, target_increase, auto_adjusted)


def v20_algo_threaded(symbols, period="6mo", interval="1d", target_increase=20, auto_adjusted=True, max_workers=None):
    """
    Run the v20 algorithm for multiple symbols concurrently.

    Args:
        symbols: Iterable of symbol strings.
        period, interval, target_increase, auto_adjusted: Same as v20_algo.
        max_workers: Optional explicit thread count.

    Returns:
        List of dictionaries: [{'symbol': 'ABC.NS', 'results': [...]}]
        Each 'results' entry mirrors the tuple structure returned by v20_algo.
    """
    if isinstance(symbols, (str, bytes)):
        raise TypeError("symbols must be an iterable of strings, not a single string.")
    if not isinstance(symbols, Iterable):
        raise TypeError("symbols must be an iterable of strings.")

    symbol_list = list(symbols)
    if not symbol_list:
        return []

    results = []
    worker_count = _resolve_max_workers(max_workers)

    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        future_map = {
            symbol: executor.submit(_run_v20_for_symbol, symbol, period, interval, target_increase, auto_adjusted)
            for symbol in symbol_list
        }

        for symbol in symbol_list:
            future = future_map[symbol]
            try:
                symbol_results = future.result()
                results.append({
                    "symbol": symbol,
                    "results": symbol_results
                })
            except Exception as exc:
                results.append({
                    "symbol": symbol,
                    "results": [],
                    "error": str(exc)
                })

    return results

