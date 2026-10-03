#!/usr/bin/env bash

# Update browser-visible PDF properties, then rewrite the PDF so removed
# metadata is not left in stale PDF objects.
#
# Example:
#   ./resume/update-pdf-metadata.sh "resume/2026-10-02 resume for Lewis Moten.pdf" \
#     --title "Lewis Moten - Resume" \
#     --subject "Professional resume for a senior front-end engineer." \
#     --keywords "Lewis Moten, resume, React, TypeScript, applied AI"

set -euo pipefail

creator="Lewis Moten"
producer="Lewis Moten"
website="https://lewismoten.com/"
github="https://github.com/lewismoten"
title=""
subject=""
keywords=""
create_backup=false
input=""

usage() {
  cat <<'EOF'
Usage:
  update-pdf-metadata.sh PDF [options]

Updates one PDF in place. It uses exiftool for metadata and qpdf to rewrite
the file, which removes stale metadata values such as a prior PDF producer.

Options:
  --title TEXT       Set the document title.
  --subject TEXT     Set the document subject.
  --keywords TEXT    Set comma-separated keywords.
  --creator TEXT     Set the PDF Creator/Application (default: Lewis Moten).
  --producer TEXT    Set the PDF Producer (default: Lewis Moten).
  --website URL      Set the creator's work URL (default: lewismoten.com).
  --github URL       Set a related-resource URL (default: GitHub profile).
  --no-website       Remove the creator work URL.
  --no-github        Remove the related-resource URL.
  --backup           Save the pre-update PDF alongside it with a .bak suffix.
  -h, --help         Show this help.

Example:
  ./resume/update-pdf-metadata.sh "resume/2026-10-02 selected projects for Lewis Moten.pdf" \
    --title "Lewis Moten - Selected Projects" \
    --subject "Portfolio of front-end engineering and applied AI projects." \
    --keywords "Lewis Moten, portfolio, JavaScript, React, applied AI"
EOF
}

require_value() {
  if [[ $# -lt 2 || -z "$2" ]]; then
    echo "Missing value for $1." >&2
    exit 2
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)
      require_value "$@"
      title="$2"
      shift 2
      ;;
    --subject)
      require_value "$@"
      subject="$2"
      shift 2
      ;;
    --keywords)
      require_value "$@"
      keywords="$2"
      shift 2
      ;;
    --creator)
      require_value "$@"
      creator="$2"
      shift 2
      ;;
    --producer)
      require_value "$@"
      producer="$2"
      shift 2
      ;;
    --website)
      require_value "$@"
      website="$2"
      shift 2
      ;;
    --github)
      require_value "$@"
      github="$2"
      shift 2
      ;;
    --no-website)
      website=""
      shift
      ;;
    --no-github)
      github=""
      shift
      ;;
    --backup)
      create_backup=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      if [[ -n "$input" ]]; then
        echo "Only one PDF may be updated at a time." >&2
        exit 2
      fi
      input="$1"
      shift
      ;;
  esac
done

if [[ -z "$input" ]]; then
  usage >&2
  exit 2
fi

if [[ ! -f "$input" || "${input##*.}" != "pdf" ]]; then
  echo "PDF not found: $input" >&2
  exit 2
fi

for command in exiftool qpdf; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Required command not found: $command" >&2
    exit 1
  fi
done

if [[ "$create_backup" == true ]]; then
  backup="${input%.pdf}.bak.pdf"
  if [[ -e "$backup" ]]; then
    echo "Backup already exists: $backup" >&2
    exit 1
  fi
  cp -p "$input" "$backup"
fi

tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/pdf-metadata.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT
staged="$tmp_dir/$(basename "$input")"
rewritten="$tmp_dir/rewritten.pdf"
cp "$input" "$staged"

metadata_args=(
  "-PDF:Creator=$creator"
  "-PDF:Producer=$producer"
  "-XMP-iptcCore:CreatorWorkURL=$website"
  "-XMP-dc:Relation=$github"
)

[[ -n "$title" ]] && metadata_args+=("-PDF:Title=$title")
[[ -n "$subject" ]] && metadata_args+=("-PDF:Subject=$subject")
[[ -n "$keywords" ]] && metadata_args+=("-PDF:Keywords=$keywords")

exiftool -overwrite_original "${metadata_args[@]}" "$staged" >/dev/null
qpdf --linearize "$staged" "$rewritten"
qpdf --check "$rewritten" >/dev/null
mv "$rewritten" "$input"

echo "Updated metadata: $input"
exiftool -s -G1 -a \
  -Title -Author -Subject -Keywords -Creator -Producer -CreatorWorkURL -Relation \
  "$input"
