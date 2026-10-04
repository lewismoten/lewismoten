#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
if [[ ! -x resume/.venv/bin/python3 ]]; then
    echo 'Run scripts/resume/setup.sh first.' >&2
    exit 1
fi
exec resume/.venv/bin/python3 update_projects.py "$@"
