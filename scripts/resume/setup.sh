#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
python3 -m venv .venv
.venv/bin/python3 -m pip install -r requirements.txt

legacy_fonts=../../resume/builder/fonts
if [[ -f "$legacy_fonts/DejaVuSans.ttf" && -f "$legacy_fonts/DejaVuSans-Bold.ttf" && -f "$legacy_fonts/LICENSE.txt" && ! -d fonts ]]; then
    cp -R "$legacy_fonts" fonts
fi
if [[ ! -f fonts/DejaVuSans.ttf || ! -f fonts/DejaVuSans-Bold.ttf || ! -f fonts/LICENSE.txt ]]; then
    .venv/bin/python3 download_fonts.py
fi
