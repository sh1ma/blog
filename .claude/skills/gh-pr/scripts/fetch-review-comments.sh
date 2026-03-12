#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'USAGE'
Usage: fetch-review-comments.sh <pr_number>

Fetch inline review comments and review status for a Pull Request.

Arguments:
  <pr_number>   PR number (required)
  --help        Show this help

Output:
  - Inline review comments: path:line - author: body
  - Review status: author: state - body

Example:
  fetch-review-comments.sh 123
USAGE
}

if [[ $# -eq 0 ]] || [[ "$1" == "--help" ]]; then
  show_help
  exit 0
fi

PR_NUMBER="$1"

if ! [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "Error: PR number must be a positive integer, got '$PR_NUMBER'" >&2
  exit 1
fi

echo "=== Inline Review Comments (PR #${PR_NUMBER}) ==="
COMMENTS=$(gh api "repos/sh1ma/blog/pulls/${PR_NUMBER}/comments" 2>/dev/null || echo "[]")
if [[ "$COMMENTS" == "[]" ]]; then
  echo "(no inline comments)"
else
  echo "$COMMENTS" | jq -r '.[] | "\(.path):\(.line // .original_line // "N/A") - \(.user.login): \(.body)"'
fi

echo ""
echo "=== Review Status (PR #${PR_NUMBER}) ==="
REVIEWS=$(gh pr view "$PR_NUMBER" --json reviews 2>/dev/null || echo '{"reviews":[]}')
REVIEW_COUNT=$(echo "$REVIEWS" | jq '.reviews | length')
if [[ "$REVIEW_COUNT" -eq 0 ]]; then
  echo "(no reviews)"
else
  echo "$REVIEWS" | jq -r '.reviews[] | "\(.author.login): \(.state) - \(.body // "(no comment)")"'
fi
