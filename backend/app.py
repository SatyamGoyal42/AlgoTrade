from flask import Flask, jsonify, request
from flask_cors import CORS
from services.runner import run_algo_from_file
from database import db, init_db
from database import models  # Import models to register them with SQLAlchemy
from routes.run_routes import run_bp
from routes.stockList_routes import stocklist_bp
from routes.backtest_routes import backtest_bp
from routes.fundamentals_routes import fundamentals_bp
from algos.v20 import v20_algo
import yaml

app = Flask(__name__)
CORS(app)

# Initialize database
init_db(app)
app.register_blueprint(run_bp)
app.register_blueprint(stocklist_bp)
app.register_blueprint(backtest_bp)
app.register_blueprint(fundamentals_bp)

@app.route("/api/test")
def test_api():
    return jsonify({"message": "Flask server is working!"})

@app.route("/api/v20/run", methods=["POST"])
def run_v20_algo():
    data = request.get_json()
    symbol = data.get("symbol")
    period = data.get("period","6mo")
    interval = data.get("interval","1d")
    target_increase = data.get("target_increase",20)
    auto_adjusted = data.get("auto_adjusted",True)
    results = v20_algo(symbol, period, interval, target_increase, auto_adjusted)
    return jsonify({"results": results})



@app.route("/api/run", methods=["POST"])
def run_algo():
    data = request.get_json()
    algo_name = data.get("algo_name","v20")
    stock_file = data.get("stock_file","stock_lists/Sample.csv")
    symbol_column = data.get("symbol_column","Symbol")
    algo_params = data.get("algo_params",{})
    
    with open("config.yaml", "r") as f:
        config = yaml.safe_load(f)
    
    results_dir = config["general"]["results_directory"]

    try:
        file_path, results = run_algo_from_file(stock_file, algo_name, algo_params, symbol_column, results_dir)
        return jsonify({
            "status": "success",
            "file_path": file_path,
            "results": results
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)