QUERY=""
FILENAMES=$(for file in src/markdown/posts/*.md;do if [ -f "$file" ]; then base=$(basename "$file" .md); echo $base; fi;done)
for filename in $FILENAMES; do
QUERY="$QUERY INSERT OR IGNORE INTO articles (id) VALUES ('$filename');";
done

wrangler d1 execute blog-iine-counter --command "$QUERY" --local