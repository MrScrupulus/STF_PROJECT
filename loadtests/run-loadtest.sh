#!/usr/bin/env bash
# Lance k6 depuis la racine du dépôt STF_Project.
# Usage :
#   ./loadtests/run-loadtest.sh                    # scénario complet (~11 min)
#   ./loadtests/run-loadtest.sh smoke              # court (~45 s, 5 VU)
#   ./loadtests/run-loadtest.sh readonly           # que des GET, pas de POST prises
#
# Prérequis : k6 installé (https://k6.io/docs/get-started/installation/)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="$ROOT/loadtests/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

MODE="${1:-full}"
shift || true

case "$MODE" in
  smoke)
    export K6_SCENARIO=smoke
    exec k6 run "$ROOT/loadtests/k6/test_peche.js" "$@"
    ;;
  readonly)
    export READ_ONLY=1
    export K6_SCENARIO=smoke
    exec k6 run "$ROOT/loadtests/k6/test_peche.js" "$@"
    ;;
  full|*)
    unset K6_SCENARIO 2>/dev/null || true
    exec k6 run "$ROOT/loadtests/k6/test_peche.js" "$@"
    ;;
esac
