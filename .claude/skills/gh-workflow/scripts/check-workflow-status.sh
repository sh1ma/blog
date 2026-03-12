#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'USAGE'
Usage: check-workflow-status.sh [<workflow_name>] [--limit <n>]

Show recent workflow run statuses.

Arguments:
  <workflow_name>   Optional. Filter by workflow (e.g., vrt, lint, e2e).
                    Accepts short names or full filenames.
  --limit <n>       Number of runs to show (default: 10)
  --help            Show this help

Examples:
  check-workflow-status.sh
  check-workflow-status.sh vrt
  check-workflow-status.sh lint --limit 5
USAGE
}

resolve_workflow() {
  case "$1" in
    vrt)                  echo "vrt.yaml" ;;
    vrt-update-baseline)  echo "vrt-update-baseline.yaml" ;;
    lint)                 echo "lint.yaml" ;;
    e2e)                  echo "e2e.yaml" ;;
    preview-deploy)       echo "preview-deploy.yaml" ;;
    staging-deploy)       echo "staging-deploy.yaml" ;;
    production-deploy)    echo "production-deploy.yaml" ;;
    register-articles)    echo "register-articles-to-d1.yaml" ;;
    create-production-pr) echo "create-production-pr.yaml" ;;
    *.yml|*.yaml)         echo "$1" ;;
    *)
      echo "Error: Unknown workflow '$1'" >&2
      exit 1
      ;;
  esac
}

WORKFLOW=""
LIMIT=10

while [[ $# -gt 0 ]]; do
  case "$1" in
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    -*)
      echo "Error: Unknown option '$1'" >&2
      exit 1
      ;;
    *)
      WORKFLOW="$1"
      shift
      ;;
  esac
done

CMD=(gh run list --limit "$LIMIT")
if [[ -n "$WORKFLOW" ]]; then
  WORKFLOW_FILE=$(resolve_workflow "$WORKFLOW")
  CMD+=(--workflow "$WORKFLOW_FILE")
fi

"${CMD[@]}"
