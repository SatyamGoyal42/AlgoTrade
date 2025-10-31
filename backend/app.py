from flask import Flask, jsonify, request
from flask_cors import CORS
from utils.runner import run_algorithm
import yaml

app = Flask(__name__)
CORS(app)

@app.route("/api/test")
def test_api():
    return jsonify({"message": "Flask server is working!"})

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
        file_path, results = run_algorithm(stock_file, algo_name, algo_params, symbol_column, results_dir)
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
    app.run(host='0.0.0.0', port=5000, debug=True)