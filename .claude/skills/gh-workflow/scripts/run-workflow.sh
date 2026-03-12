#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'USAGE'
Usage: run-workflow.sh <workflow_name> [options]

Run a GitHub Actions workflow.

Workflow names (short -> file):
  vrt                  -> vrt.yaml
  vrt-update-baseline  -> vrt-update-baseline.yaml
  lint                 -> lint.yaml
  e2e                  -> e2e.yaml
  preview-deploy       -> preview-deploy.yaml
  staging-deploy       -> staging-deploy.yaml
  production-deploy    -> production-deploy.yaml
  register-articles    -> register-articles-to-d1.yaml
  create-production-pr -> create-production-pr.yaml

Options:
  --ref <branch>          Branch/tag to run on (default: current branch)
  --update-snapshots      For 'vrt': enable snapshot update mode
  --pr <number>           For 'vrt-update-baseline': PR number
  --help                  Show this help

Examples:
  run-workflow.sh vrt
  run-workflow.sh vrt --update-snapshots --ref feat/new-ui
  run-workflow.sh vrt-update-baseline --pr 42
  run-workflow.sh lint --ref main
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
      echo "Run with --help to see available workflows." >&2
      exit 1
      ;;
  esac
}

if [[ $# -eq 0 ]] || [[ "$1" == "--help" ]]; then
  show_help
  exit 0
fi

WORKFLOW_NAME="$1"
shift

WORKFLOW_FILE=$(resolve_workflow "$WORKFLOW_NAME")
REF=""
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref)
      REF="$2"
      shift 2
      ;;
    --update-snapshots)
      if [[ "$WORKFLOW_NAME" != "vrt" ]]; then
        echo "Error: --update-snapshots is only valid for 'vrt' workflow" >&2
        exit 1
      fi
      EXTRA_ARGS+=(-f update_snapshots=true)
      shift
      ;;
    --pr)
      if [[ "$WORKFLOW_NAME" != "vrt-update-baseline" ]]; then
        echo "Error: --pr is only valid for 'vrt-update-baseline' workflow" >&2
        exit 1
      fi
      EXTRA_ARGS+=(-f pr_number="$2")
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

CMD=(gh workflow run "$WORKFLOW_FILE")
if [[ -n "$REF" ]]; then
  CMD+=(--ref "$REF")
fi
CMD+=("${EXTRA_ARGS[@]}")

echo "Running: ${CMD[*]}"
"${CMD[@]}"
echo "Workflow '$WORKFLOW_NAME' ($WORKFLOW_FILE) triggered successfully."
