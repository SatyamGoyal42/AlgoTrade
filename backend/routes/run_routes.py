from flask import Blueprint, request, jsonify
from services.runner import run_algo_on_symbol, run_algo_on_list

run_bp = Blueprint("run_bp", __name__, url_prefix="/api/run")


@run_bp.route("/symbol", methods=["POST"])
def run_on_symbol():
    """
    Run algorithm on a single stock symbol.
    Expected JSON body:
    {
        "symbol": "TCS",
        "algo_name": "v20",
        "algo_params": {"param1": 10, "param2": 5},
        "persist": true
    }
    """
    try:
        data = request.get_json()
        symbol = data.get("symbol")
        algo_name = data.get("algo_name")
        algo_params = data.get("algo_params", {})
        persist = data.get("persist", False)

        if not symbol or not algo_name:
            return jsonify({"error": "Missing required fields: symbol, algo_name"}), 400

        results = run_algo_on_symbol(symbol, algo_name, algo_params, persist=persist)
        return jsonify({"success": True, "results": results}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@run_bp.route("/list/<int:stock_list_id>", methods=["POST"])
def run_on_list(stock_list_id):
    """
    Run algorithm on all symbols in a stock list.
    Expected JSON body:
    {
        "algo_name": "v20",
        "algo_params": {"param1": 10},
        "persist": true
    }
    """
    try:
        data = request.get_json()
        algo_name = data.get("algo_name")
        algo_params = data.get("algo_params", {})
        persist = data.get("persist", False)

        if not algo_name:
            return jsonify({"error": "Missing required field: algo_name"}), 400

        results = run_algo_on_list(stock_list_id, algo_name, algo_params, persist=persist)
        return jsonify({"success": True, "results": results}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

