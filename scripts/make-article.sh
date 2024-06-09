if [ -z $1 ]; then
    echo "Usage: make-article.sh <id> [title]"
    exit 1
fi  

id=$1

if [ -z $2 ]; then
    title="Untitled"
else
    title=$2
fi

date_prefix=$(date "+%Y%m%d")
filepath="$(dirname $0)/../src/markdown/posts/${date_prefix}_$id.md"


if [ -f $filepath ]; then
    echo "File already exists: $filepath"
    exit 1
fi

touch $filepath
echo "---" > $filepath
echo "title: $title" >> $filepath
echo "publishedAt: \"$(date "+%Y-%m-%d")\"" >> $filepath
echo "---" >> $filepath

echo "Created $filepath"