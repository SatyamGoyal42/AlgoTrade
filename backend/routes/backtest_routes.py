from flask import Blueprint, request, jsonify
from services.backtester import backtest_algo_on_symbol, backtest_algo_on_list

try:
    from algos import backtest_v20
    from algos import backtest_v20extra
except ImportError:
    pass

backtest_bp = Blueprint("backtest_bp", __name__, url_prefix="/api/backtest")


@backtest_bp.route("/symbol", methods=["POST"])
def backtest_on_symbol():
    """
    Backtest algorithm on a single stock symbol.
    Expected JSON body:
    {
        "symbol": "TCS",
        "algo_name": "v20",
        "algo_params": {
            "period": "6mo",           # Optional: "1mo", "3mo", "6mo", "1y", "2y", etc.
            "interval": "1d",          # Optional: "1d", "1wk", "1mo", etc.
            "target_increase": 20,     # Optional: minimum percentage increase (default: 20)
            "auto_adjusted": true      # Optional: auto-adjust prices for splits/dividends (default: true)
        }
    }
    Note: Initial capital defaults to 100000, transaction cost defaults to 0.001
    """
    try:
        data = request.get_json()
        symbol = data.get("symbol")
        algo_name = data.get("algo_name")
        algo_params = data.get("algo_params", {})

        if not symbol or not algo_name:
            return jsonify({"error": "Missing required fields: symbol, algo_name"}), 400

        results = backtest_algo_on_symbol(symbol, algo_name, algo_params)
        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@backtest_bp.route("/list/<int:stock_list_id>", methods=["POST"])
def backtest_on_list(stock_list_id):
    """
    Backtest algorithm on all symbols in a stock list.
    Expected JSON body:
    {
        "algo_name": "v20",
        "algo_params": {
            "period": "6mo",           # Optional: "1mo", "3mo", "6mo", "1y", "2y", etc.
            "interval": "1d",          # Optional: "1d", "1wk", "1mo", etc.
            "target_increase": 20,     # Optional: minimum percentage increase (default: 20)
            "auto_adjusted": true      # Optional: auto-adjust prices for splits/dividends (default: true)
        }
    }
    Note: Initial capital defaults to 100000, transaction cost defaults to 0.001
    """
    try:
        data = request.get_json()
        algo_name = data.get("algo_name")
        algo_params = data.get("algo_params", {})

        if not algo_name:
            return jsonify({"error": "Missing required field: algo_name"}), 400

        results = backtest_algo_on_list(stock_list_id, algo_name, algo_params)
        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

