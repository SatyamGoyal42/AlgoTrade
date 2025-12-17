import json
from typing import Any, Dict, List, Tuple


def _safe_get(data: Dict[str, Any], *keys: str) -> Any:
    current: Any = data
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _extract_company_summary(data: Dict[str, Any]) -> Dict[str, Any]:
    companyProfile = data.get("companyProfile") or {}
    print(companyProfile)
    return {
        "name": data.get("companyName"),
        "companyDescription": companyProfile.get("companyDescription"),
        "industry": companyProfile.get("mgIndustry"),
        "symbol": companyProfile.get("exchangeCodeNse")
    }




def _extract_key_metrics(data: Dict[str, Any]) -> Dict[str, Any]:
    key_metrics = data.get("keyMetrics") or {}
    return {
        "price_to_earnings": key_metrics.get("priceToEarnings"),
        "price_to_book": key_metrics.get("priceToBook"),
        "price_to_sales": key_metrics.get("priceToSales"),
    }

def _extract_shareholding(data: Dict[str, Any]) -> Dict[str, Any]:
 
    shareholding_list = data.get("shareholding", [])

    result = {}

    for category in shareholding_list:
        if not isinstance(category, dict):
            continue

        name = category.get("displayName") or category.get("categoryName") or "Unknown"
        entries = category.get("categories", [])

        # Normalize each entry
        cleaned_entries = []
        for entry in entries:
            if not isinstance(entry, dict):
                continue

            cleaned_entries.append(
                {
                    "date": entry.get("holdingDate"),
                    "percentage": safe_float(entry.get("percentage")),
                }
            )

        result[name] = cleaned_entries

    return result


def safe_float(value):
    try:
        return float(value) if value not in ("", None) else None
    except:
        return None

def transform_fundamentals(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform the raw fundamentals response into a curated structure for the API/clients.
    """
    if not isinstance(payload, dict):
        return {"summary": {}, "price": {}, "financials": {}, "ratios": {}, "shareholding": []}
 
    print("--------------------------------")
    print("TYPE:", type(payload))
    print("--------------------------------")
    print("\n===== TOP LEVEL KEYS =====")
    print(payload.keys())
    print("===== END =====\n")
    print("--------------------------------")

    summary = _extract_company_summary(payload)
    #financials = _extract_financials(payload)
    shareholding = _extract_shareholding(payload)

    return {
        "summary": summary,
        #"price": price,
        #"financials": financials,
        #"ratios": ratios,
        "shareholding": shareholding,
        #"raw": data,
    }

