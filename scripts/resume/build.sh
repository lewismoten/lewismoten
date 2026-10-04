#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
if [[ ! -x .venv/bin/python3 ]]; then
    echo 'Run scripts/resume/setup.sh first.' >&2
    exit 1
fi
exec .venv/bin/python3 build.py "$@"
