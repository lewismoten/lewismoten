# Resume and project PDF builder

This builder reads career text from `resume.yaml` and `letter.yaml`. Each
project's title, description, image name, and links live in a matching YAML file
beside its existing 320 × 160 JPEG in `../../projects/`:

```text
projects/
  crystal-9.jpg
  crystal-9.yaml
  crystal-palace.jpg
  crystal-palace.yaml
  ...
  index.yaml             # profile order and four-card PDF pages
resume/builder/
  build.py               # PDFs; optional README update
  project_data.py        # project loading and README table
  resume.yaml
  letter.yaml
  download_fonts.py
```

## Build

Open a terminal in `resume/builder` (`cd resume/builder` first if at
the repository root). On macOS or Linux, run:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 download_fonts.py    # once per checkout
python3 build.py --update-readme
```

The PDFs go into `resume/`, and `--update-readme` also refreshes only the
`## Projects` table between the two `PROJECTS` comment markers in the root
README. Use `--output-dir /path/to/preview` without `--update-readme` for a
trial PDF build. If changed only a project card and want to refresh the
profile table and project PDF, run:

```bash
python3 build.py --only projects --update-readme
```

To refresh the profile table without rebuilding any PDFs, run:

```bash
python3 project_data.py
```

The downloaded DejaVu fonts and license are kept in ignored `fonts/`; they are
not committed to the repository. `requirements.txt` lists the Python packages.

## Edit projects

For example, `projects/crystal-9.yaml` sits beside `projects/crystal-9.jpg`:

```yaml
name: Crystal-9
title: Crystal-9 | Tiny MoE for 8-bit hardware
image: crystal-9.jpg
description: >-
  Write a readable paragraph over several lines. YAML joins those lines
  with spaces when the builder reads the card.
links:
  - label: Source
    url: https://github.com/lewismoten/crystal-9
```

Keep the YAML and image basenames identical. Add the project's slug to
`projects/index.yaml` under `profile_order` to show it in the GitHub table.
`pdf_pages` selects twelve of those cards and groups them four per PDF page.
A card can appear in the profile without appearing in the PDF; Shoomi's
HomePage currently does. The builder checks filenames, image existence,
page counts, and duplicate entries before publishing the new PDFs.

Change `resume.yaml` to edit resume copy or the `output_date` prefix, and
`letter.yaml` to edit the introduction letter. If `output_date` changes,
update the three career-document links in the root README after rebuilding.
Review each PDF visually after changing descriptions or images; a long card
can overflow its page.
