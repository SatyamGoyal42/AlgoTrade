import os
from typing import Any, Dict

import requests
from dotenv import load_dotenv

load_dotenv()

_API_KEY = os.getenv("FUNDAMENTALS_API")
_BASE_URL = os.getenv("FUNDAMENTALS_URI")

DEFAULT_TIMEOUT_SECONDS = 10


class FundamentalsAPIError(Exception):
    """Raised when the external fundamentals API returns an error."""


def _build_headers() -> Dict[str, str]:
    if not _API_KEY:
        raise RuntimeError(
            "FUNDAMENTALS_API_KEY environment variable is not set. "
            "Please configure credentials for the fundamentals API."
        )
    return {"X-Api-Key": _API_KEY}


def _build_endpoint() -> str:
    if not _BASE_URL:
        raise RuntimeError(
            "FUNDAMENTALS_URL environment variable is not set. "
            "Please configure the fundamentals API base URL."
        )
    return f"{_BASE_URL.rstrip('/')}/stock"


def fetch_fundamentals(symbol: str) -> Dict[str, Any]:
    """
    Fetch fundamental data for the provided stock symbol/name.

    Args:
        symbol: Stock identifier accepted by the external API (name or ticker).

    Returns:
        Parsed JSON payload from the external service.
    """
    if not symbol or not symbol.strip():
        raise ValueError("A non-empty symbol must be provided.")

    endpoint = _build_endpoint()
    headers = _build_headers()
    params = {"name": symbol.strip()}

    try:
        response = requests.get(
            endpoint,
            headers=headers,
            params=params,
            timeout=DEFAULT_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise FundamentalsAPIError(f"Failed to fetch fundamentals: {exc}") from exc

    try:
        payload: Dict[str, Any] = response.json()
    except ValueError as exc:
        raise FundamentalsAPIError("Fundamentals API returned non-JSON response.") from exc

    return payload
