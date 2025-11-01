import os
import yaml
import pandas as pd
from datetime import datetime
from algos.v20 import v20_algo
from algos.v20extra import v20_extra_algo
from database.config import db
from models import AlgorithmResult, StockList, StockItem

# Map algorithm names to their respective functions
ALGOS = {
    "v20": v20_algo,
    "v20extra": v20_extra_algo
}


def get_algo_func(algo_name: str):
    """
    Returns the algorithm function by name.
    """
    if algo_name not in ALGOS:
        raise ValueError(f"Unknown algorithm: {algo_name}")
    return ALGOS[algo_name]


def run_algo_on_symbol(symbol: str, algo_name: str, algo_params: dict, persist: bool = False):
    """
    Runs the specified algorithm on a single stock symbol.
    Returns a list of result dicts.
    """
    algo_func = get_algo_func(algo_name)
    all_results = []

    try:
        results = algo_func(symbol + ".NS", **algo_params)
        for lp_date, hp_date, lp_price, hp_price, perc, LP_to_present in results:
            res = {
                "symbol": symbol,
                "algo": algo_name,
                "lp_date": lp_date,
                "hp_date": hp_date,
                "lp_price": lp_price,
                "hp_price": hp_price,
                "percentage_increase": perc,
                "percentage_from_bp_to_today": LP_to_present
            }
            all_results.append(res)

            if persist:
                db_result = AlgorithmResult(
                    symbol=symbol,
                    algo_name=algo_name,
                    lp_date=lp_date,
                    hp_date=hp_date,
                    lp_price=lp_price,
                    hp_price=hp_price,
                    percentage_increase=perc,
                    percentage_from_bp_to_today=LP_to_present,
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

    for symbol in symbols:
        print(f"Running {algo_name} on {symbol}...")
        symbol_results = run_algo_on_symbol(symbol, algo_name, algo_params, persist=persist)
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

    for symbol in symbols:
        print(f"Running {algo_name} on {symbol} ...")
        try:
            results = run_algo_on_symbol(symbol, algo_name, algo_params)
            all_results.extend(results)
        except Exception as e:
            print(f"Error processing {symbol}: {e}")

    if all_results:
        df = pd.DataFrame(all_results)
        out_path = os.path.join(results_dir, f"{algo_name}_results.csv")
        df.to_csv(out_path, index=False)
        return out_path, df.to_dict(orient="records")
    else:
        return None, []
