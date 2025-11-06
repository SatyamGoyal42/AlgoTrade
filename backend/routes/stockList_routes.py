from flask import Blueprint, request, jsonify
from database.config import db
from database.models import StockList, StockItem

stocklist_bp = Blueprint("stocklist_bp", __name__, url_prefix="/api/stocklists")


# Create a new stock list
@stocklist_bp.route("", methods=["POST"])
def create_list():
    data = request.get_json()
    name = data.get("name")
    if not name:
        return jsonify({"error": "Missing name"}), 400

    new_list = StockList(name=name)
    db.session.add(new_list)
    db.session.commit()
    return jsonify({"id": new_list.id, "name": new_list.name}), 201


# Get all stock lists
@stocklist_bp.route("", methods=["GET"])
def get_all_lists():
    lists = StockList.query.all()
    return jsonify([
        {"id": l.id, "name": l.name, "stocks": [s.symbol for s in l.stocks]}
        for l in lists
    ]), 200


# Get a specific stock list
@stocklist_bp.route("/<int:list_id>", methods=["GET"])
def get_list(list_id):
    stock_list = StockList.query.get(list_id)
    if not stock_list:
        return jsonify({"error": "List not found"}), 404
    return jsonify({
        "id": stock_list.id,
        "name": stock_list.name,
        "stocks": [s.symbol for s in stock_list.stocks]
    }), 200


# Update list name
@stocklist_bp.route("/<int:list_id>", methods=["PUT"])
def update_list(list_id):
    stock_list = StockList.query.get(list_id)
    if not stock_list:
        return jsonify({"error": "List not found"}), 404

    data = request.get_json()
    new_name = data.get("name")
    if new_name:
        stock_list.name = new_name
    db.session.commit()
    return jsonify({"message": "List updated", "name": stock_list.name}), 200


# Delete a list
@stocklist_bp.route("/<int:list_id>", methods=["DELETE"])
def delete_list(list_id):
    stock_list = StockList.query.get(list_id)
    if not stock_list:
        return jsonify({"error": "List not found"}), 404

    db.session.delete(stock_list)
    db.session.commit()
    return jsonify({"message": f"List {list_id} deleted"}), 200


# Add stock to list
@stocklist_bp.route("/<int:list_id>/stocks", methods=["POST"])
def add_stock_to_list(list_id):
    data = request.get_json()
    symbol = data.get("symbol")
    symbols = data.get("symbols", [])  # Support bulk add
    
    # If single symbol provided, convert to list for uniform handling
    if symbol and not symbols:
        symbols = [symbol]
    elif symbol and symbols:
        # If both provided, combine them
        symbols = [symbol] + symbols
    
    if not symbols:
        return jsonify({"error": "Missing symbol or symbols"}), 400

    stock_list = StockList.query.get(list_id)
    if not stock_list:
        return jsonify({"error": "List not found"}), 404

    # Normalize symbols (uppercase, remove duplicates)
    symbols = list(set([s.strip().upper() for s in symbols if s.strip()]))
    
    results = {
        "added": [],
        "duplicates": [],
        "failed": []
    }

    # Get existing stocks in the list
    existing_symbols = {item.symbol for item in stock_list.stocks}
    
    # Separate new symbols from duplicates
    new_symbols = [s for s in symbols if s not in existing_symbols]
    results["duplicates"] = [s for s in symbols if s in existing_symbols]
    
    if not new_symbols:
        return jsonify({
            "message": "No new stocks to add",
            "results": results
        }), 200
    
    # Bulk fetch existing stock items
    existing_stocks = {item.symbol: item for item in StockItem.query.filter(
        StockItem.symbol.in_(new_symbols)
    ).all()}
    
    # Create missing stock items and prepare relationships
    stocks_to_add = []
    for symbol in new_symbols:
        try:
            if symbol in existing_stocks:
                stock = existing_stocks[symbol]
            else:
                stock = StockItem(symbol=symbol)
                db.session.add(stock)
            
            stocks_to_add.append(stock)
            results["added"].append(symbol)
        except Exception as e:
            results["failed"].append({"symbol": symbol, "error": str(e)})
    
    # Bulk add relationships to the list
    try:
        stock_list.stocks.extend([s for s in stocks_to_add if s not in stock_list.stocks])
        db.session.commit()
        
        return jsonify({
            "message": f"Added {len(results['added'])} stock(s) to list {stock_list.name}",
            "results": results
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to add stocks: {str(e)}"}), 500


# Remove stock from list
@stocklist_bp.route("/<int:list_id>/stocks/<string:symbol>", methods=["DELETE"])
def remove_stock_from_list(list_id, symbol):
    stock_list = StockList.query.get(list_id)
    if not stock_list:
        return jsonify({"error": "List not found"}), 404

    stock = StockItem.query.filter_by(symbol=symbol).first()
    if not stock or stock not in stock_list.stocks:
        return jsonify({"error": f"{symbol} not in list"}), 400

    stock_list.stocks.remove(stock)
    db.session.commit()
    return jsonify({"message": f"{symbol} removed from list {stock_list.name}"}), 200
