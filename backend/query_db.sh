#!/bin/bash
# Quick database query script using your DATABASE_URL

# Get connection string from .env (handles spaces after =)
DB_URL=$(grep "^DATABASE_URL" .env | sed 's/^DATABASE_URL[[:space:]]*=[[:space:]]*//')

if [ -z "$DB_URL" ]; then
    echo "ERROR: DATABASE_URL not found in .env"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "psql not found. Installing..."
    echo "Run: sudo apt-get install postgresql-client"
    exit 1
fi

# Run query passed as argument, or show help
if [ -z "$1" ]; then
    echo "=========================================="
    echo "AlgoTrade Database Query Helper"
    echo "=========================================="
    echo ""
    echo "Usage:"
    echo "  ./query_db.sh 'SELECT * FROM stock_lists;'"
    echo ""
    echo "Quick queries:"
    echo "  ./query_db.sh tables          # Show all tables"
    echo "  ./query_db.sh stocklists      # Show stock lists"
    echo "  ./query_db.sh stocks          # Show stock items"
    echo "  ./query_db.sh results         # Show algorithm results"
    echo ""
    echo "Or connect interactively:"
    echo "  psql \"\$DATABASE_URL\""
    exit 0
fi

# Quick query shortcuts
case "$1" in
    tables)
        QUERY="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
        ;;
    stocklists)
        QUERY="SELECT * FROM stock_lists;"
        ;;
    stocks)
        QUERY="SELECT * FROM stock_items;"
        ;;
    results)
        QUERY="SELECT * FROM algorithm_results ORDER BY created_at DESC LIMIT 10;"
        ;;
    *)
        QUERY="$1"
        ;;
esac

# Execute query
echo "Executing query..."
echo ""
psql "$DB_URL" -c "$QUERY"

