from flask import Blueprint, jsonify, request

from services.fundamentals import FundamentalsAPIError, fetch_fundamentals
from services.fundamentals_transformer import transform_fundamentals

fundamentals_bp = Blueprint("fundamentals_bp", __name__, url_prefix="/api/fundamentals")


@fundamentals_bp.route("/stock", methods=["GET"])
def get_fundamentals_stock():
    """
    Proxy fundamentals data for a given symbol/name.
    """
    symbol = request.args.get("symbol") or request.args.get("name")
    if not symbol:
        return jsonify({"error": "Query parameter 'symbol' is required."}), 400

    try:
        payload = fetch_fundamentals(symbol)
        cleaned_payload = transform_fundamentals(payload)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except FundamentalsAPIError as exc:
        return (
            jsonify(
                {
                    "error": "Unable to fetch fundamentals at this time.",
                    "details": str(exc),
                }
            ),
            502,
        )

    return jsonify({"symbol": symbol, "data": cleaned_payload})
