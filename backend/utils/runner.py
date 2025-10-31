import os
import yaml
import pandas as pd
from algos.v20 import v20_algo
from algos.v20extra import v20_extra_algo

def run_algorithm(stock_file, algo_name, algo_params, symbol_column, results_dir):
    with open("config.yaml", "r") as f:
        config = yaml.safe_load(f)

    os.makedirs(results_dir, exist_ok=True)

    algos = {
        "v20": v20_algo,
        "v20extra": v20_extra_algo
    }

    if algo_name not in algos:
        raise ValueError(f"Unknown algorithm: {algo_name}")

    algo_func = algos[algo_name]
    symbols = pd.read_csv(stock_file)[symbol_column].dropna().tolist()
    all_results = []

    for symbol in symbols:
        print(f"\n -Running {algo_name} on {symbol} ...")
        try:
            results = algo_func(symbol + ".NS", **algo_params)
            for lp_date, hp_date, lp_price, hp_price, perc, LP_to_present in results:
                all_results.append({
                    "Symbol": symbol,
                    "LP_Date": lp_date,
                    "HP_Date": hp_date,
                    "LP_Price": lp_price,
                    "HP_Price": hp_price,
                    "Percentage_Increase": perc,
                    "%TodayfromBP": LP_to_present
                })
        except Exception as e:
            print(f"Error processing {symbol}: {e}")

    if all_results:
        result_df = pd.DataFrame(all_results)
        out_path = os.path.join(results_dir, f"{algo_name}_results.csv")
        result_df.to_csv(out_path, index=False)
        return out_path, result_df.to_dict(orient='records')
    else:
        return None, []
