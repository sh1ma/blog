#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'USAGE'
Usage: check-pr-status.sh [<pr_number>]

Show CI check status for a Pull Request.

Arguments:
  <pr_number>   PR number (optional, defaults to current branch's PR)
  --help        Show this help

Example:
  check-pr-status.sh
  check-pr-status.sh 123
USAGE
}

if [[ $# -gt 0 ]] && [[ "$1" == "--help" ]]; then
  show_help
  exit 0
fi

if [[ $# -gt 0 ]]; then
  PR_NUMBER="$1"
  if ! [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
    echo "Error: PR number must be a positive integer, got '$PR_NUMBER'" >&2
    exit 1
  fi
  gh pr checks "$PR_NUMBER"
else
  gh pr checks
fi
