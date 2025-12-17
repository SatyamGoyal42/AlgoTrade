import os
import importlib
import yaml
import pandas as pd
import numpy as np
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from algos.v20 import v20_algo
from algos.v20extra import v20_extra_algo
from database.config import db
from database.models.algoResults import AlgorithmResult
from database.models.stockListAndItemModel import StockList, StockItem

# Map algorithm names to their respective functions
ALGOS = {
    "v20": v20_algo,
    "v20extra": v20_extra_algo
}


def _determine_worker_count(requested, cap=5):
    """
    Normalize requested worker count against the configured cap.
    """
    if requested is None:
        return cap
    return max(1, min(requested, cap))


def get_algo_func(algo_name: str):
    """
    Returns the algorithm function by name.
    """
    if algo_name not in ALGOS:
        raise ValueError(f"Unknown algorithm: {algo_name}")
    return ALGOS[algo_name]


def _append_suffix(symbol: str) -> str:
    return symbol if symbol.endswith(".NS") else f"{symbol}.NS"


def _strip_suffix(symbol: str) -> str:
    return symbol[:-3] if symbol.endswith(".NS") else symbol


def _get_threaded_results(symbols, algo_name: str, algo_params: dict):
    """
    If the underlying algo exposes a threaded variant, run it once and
    collect results keyed by the base symbol.
    """
    algo_func = get_algo_func(algo_name)
    module = importlib.import_module(algo_func.__module__)
    threaded_name = f"{algo_func.__name__}_threaded"
    threaded_func = getattr(module, threaded_name, None)

    if not callable(threaded_func) or not symbols:
        return {}

    try:
        raw_results = threaded_func([_append_suffix(sym) for sym in symbols], **algo_params)
    except TypeError:
        # Signature mismatch or unexpected params – fallback to per-symbol execution.
        return {}

    collected = {}
    for entry in raw_results or []:
        entry_symbol = entry.get("symbol")
        if not entry_symbol:
            continue
        normalized_symbol = _strip_suffix(entry_symbol)
        collected[normalized_symbol] = {
            "results": entry.get("results", []),
            "error": entry.get("error")
        }
    return collected


def run_algo_on_symbol(symbol: str, algo_name: str, algo_params: dict, persist: bool = False,
                       precomputed_results=None, precomputed_error: str | None = None):
    """
    Runs the specified algorithm on a single stock symbol.
    Returns a list of result dicts.
    """
    algo_func = get_algo_func(algo_name)
    all_results = []

    if precomputed_error:
        return [{"symbol": symbol, "error": precomputed_error}]

    try:
        if precomputed_results is None:
            full_symbol = _append_suffix(symbol)
            results = algo_func(full_symbol, **algo_params)
        else:
            results = precomputed_results
        for lp_date, hp_date, lp_price, hp_price, perc, LP_to_present in results:
            if hasattr(lp_date, 'strftime'):
                lp_date_str = lp_date.strftime('%Y-%m-%d')
            elif isinstance(lp_date, str):
                lp_date_str = lp_date
            else:
                lp_date_str = str(lp_date)
                
            if hasattr(hp_date, 'strftime'):
                hp_date_str = hp_date.strftime('%Y-%m-%d')
            elif isinstance(hp_date, str):
                hp_date_str = hp_date
            else:
                hp_date_str = str(hp_date)
            
            def safe_float(value):
                if value is None:
                    return None
                try:
                    if pd.isna(value):
                        return None
                    if hasattr(value, 'item'):
                        return float(value.item())
                    return float(value)
                except (ValueError, TypeError, AttributeError):
                    return None
            
            lp_price_float = safe_float(lp_price)
            hp_price_float = safe_float(hp_price)
            perc_float = safe_float(perc)
            lp_to_present_float = safe_float(LP_to_present)
            
            res = {
                "symbol": symbol,
                "algo": algo_name,
                "lowPriceDate": lp_date_str,
                "highPriceDate": hp_date_str,
                "lowPrice": lp_price_float,
                "highPrice": hp_price_float,
                "percentageIncrease": perc_float,
                "percentageFromHighPriceToToday": lp_to_present_float
            }
            all_results.append(res)

            if persist:
                db_result = AlgorithmResult(
                    symbol=symbol,
                    algo_name=algo_name,
                    lowPriceDate=lp_date,
                    highPriceDate=hp_date,
                    lowPrice=lp_price,
                    highPrice=hp_price,
                    percentageIncrease=perc,
                    percentageFromHighPriceToToday=LP_to_present,
                    algo_params=algo_params,
                    created_at=datetime.utcnow()
                )
                db.session.add(db_result)

        if persist and all_results:
            db.session.commit()

    except Exception as e:
        all_results.append({"symbol": symbol, "error": str(e)})

    return all_results


def run_algo_on_list(stock_list_id: int, algo_name: str, algo_params: dict, persist: bool = False):
    """
    Runs the specified algorithm on every stock in a stock list.
    Returns a combined list of results for all symbols.
    """
    stock_list = StockList.query.get(stock_list_id)
    if not stock_list:
        raise ValueError(f"StockList with id={stock_list_id} not found.")

    symbols = [item.symbol for item in stock_list.stocks]
    combined_results = []

    threaded_map = _get_threaded_results(symbols, algo_name, algo_params)

    if threaded_map:
        for symbol in symbols:
            entry = threaded_map.get(symbol)
            if not entry:
                print(f"Running {algo_name} on {symbol}...")
                symbol_results = run_algo_on_symbol(symbol, algo_name, algo_params, persist=persist)
            else:
                if entry.get("error"):
                    symbol_results = run_algo_on_symbol(
                        symbol,
                        algo_name,
                        algo_params,
                        persist=persist,
                        precomputed_error=entry["error"]
                    )
                else:
                    symbol_results = run_algo_on_symbol(
                        symbol,
                        algo_name,
                        algo_params,
                        persist=persist,
                        precomputed_results=entry.get("results", [])
                    )
            combined_results.extend(symbol_results)
        return combined_results

    max_workers = min(len(symbols), os.cpu_count() or 4) or 1
    worker_count = _determine_worker_count(max_workers)
    print(f"Running {algo_name} on {len(symbols)} symbols using {worker_count} thread(s)...")

    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        future_map = {
            symbol: executor.submit(run_algo_on_symbol, symbol, algo_name, algo_params, persist)
            for symbol in symbols
        }

        for symbol in symbols:
            try:
                symbol_results = future_map[symbol].result()
            except Exception as exc:
                symbol_results = [{"symbol": symbol, "error": str(exc)}]
            combined_results.extend(symbol_results)

    return combined_results


def run_algo_from_file(stock_file: str, algo_name: str, algo_params: dict, symbol_column: str, results_dir: str):
    """
    Keeps your current CSV-based workflow (optional).
    """
    with open("config.yaml", "r") as f:
        config = yaml.safe_load(f)

    os.makedirs(results_dir, exist_ok=True)
    symbols = pd.read_csv(stock_file)[symbol_column].dropna().tolist()
    all_results = []

    threaded_map = _get_threaded_results(symbols, algo_name, algo_params)

    if threaded_map:
        for symbol in symbols:
            entry = threaded_map.get(symbol, {})
            if entry.get("error"):
                print(f"Error processing {symbol}: {entry['error']}")
                all_results.append({"symbol": symbol, "error": entry["error"]})
                continue
            results = run_algo_on_symbol(
                symbol,
                algo_name,
                algo_params,
                precomputed_results=entry.get("results", [])
            )
            all_results.extend(results)
    else:
        max_workers = min(len(symbols), os.cpu_count() or 4) or 1
        worker_count = _determine_worker_count(max_workers)
        print(f"Running {algo_name} on {len(symbols)} symbols using {worker_count} thread(s)...")

        with ThreadPoolExecutor(max_workers=worker_count) as executor:
            future_map = {
                symbol: executor.submit(run_algo_on_symbol, symbol, algo_name, algo_params)
                for symbol in symbols
            }

            for symbol in symbols:
                try:
                    results = future_map[symbol].result()
                    all_results.extend(results)
                except Exception as e:
                    error_msg = str(e)
                    print(f"Error processing {symbol}: {error_msg}")
                    all_results.append({"symbol": symbol, "error": error_msg})

    if all_results:
        df = pd.DataFrame(all_results)
        out_path = os.path.join(results_dir, f"{algo_name}_results.csv")
        df.to_csv(out_path, index=False)
        return out_path, df.to_dict(orient="records")
    else:
        return None, []
