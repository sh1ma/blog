#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'USAGE'
Usage: create-pr.sh --title <title> --label <label> [--label ...] --body <body>

Create a GitHub Pull Request with label validation and auto-assignee.

Options:
  --title <title>   PR title (required)
  --label <label>   Label to apply (repeatable, at least one required)
  --body <body>     PR body (required, must follow .github/pull_request_template.md)
  --help            Show this help

Valid labels: feature, bug, refactoring, documentation, chore, AI, test

Example:
  create-pr.sh --title "Add dark mode" --label feature --body "## 概要\n..."
USAGE
}

VALID_LABELS=(feature bug refactoring documentation chore AI test)

validate_label() {
  local label="$1"
  for valid in "${VALID_LABELS[@]}"; do
    if [[ "$label" == "$valid" ]]; then
      return 0
    fi
  done
  echo "Error: Invalid label '$label'" >&2
  echo "Valid labels: ${VALID_LABELS[*]}" >&2
  exit 1
}

if [[ $# -eq 0 ]] || [[ "$1" == "--help" ]]; then
  show_help
  exit 0
fi

TITLE=""
LABELS=()
BODY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)
      TITLE="$2"
      shift 2
      ;;
    --label)
      LABELS+=("$2")
      shift 2
      ;;
    --body)
      BODY="$2"
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Error: Unknown option '$1'" >&2
      exit 1
      ;;
  esac
done

# Validate required fields
if [[ -z "$TITLE" ]]; then
  echo "Error: --title is required" >&2
  exit 1
fi
if [[ ${#LABELS[@]} -eq 0 ]]; then
  echo "Error: At least one --label is required" >&2
  exit 1
fi
if [[ -z "$BODY" ]]; then
  echo "Error: --body is required" >&2
  exit 1
fi

# Validate all labels
for label in "${LABELS[@]}"; do
  validate_label "$label"
done

# Build command
CMD=(gh pr create --title "$TITLE" --assignee sh1ma --body "$BODY")
for label in "${LABELS[@]}"; do
  CMD+=(--label "$label")
done

echo "Creating PR: $TITLE"
echo "Labels: ${LABELS[*]}"
"${CMD[@]}"
