echo "Import remote DB Start"
echo "Export remote DB to local"
THIS_SCRIPT_DIR=$(cd $(dirname $0); pwd)
DB_NAME=blog-iine-counter
wrangler d1 export $DB_NAME --output=./tmp/db.sql --remote

echo "Drop local DB"
rm .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*

echo "Import local DB"
wrangler d1 execute $DB_NAME --file=./tmp/db.sql --local

rm ./tmp/db.sql

echo "Import remote DB End"