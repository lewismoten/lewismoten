# Resume builder and project profile

The career PDFs read `scripts/resume/resume.yaml` and `scripts/resume/letter.yaml`.
Each project has a YAML card beside its 320 × 160 JPEG in `projects/`. The
`projects/index.yaml` file controls profile categories and PDF page selection.

```text
projects/
  crystal-9.jpg
  crystal-9.yaml
  crystal-palace.jpg
  crystal-palace.yaml
  ...
  index.yaml             # profile categories and four-card PDF pages
scripts/
  update-projects.sh     # regenerate the root README Projects section
  update_projects.py     # project loading and table generation
  resume/
    setup.sh             # create .venv, install packages and fonts
    build.sh             # build the career PDFs
    build.py
    resume.yaml
    letter.yaml
    README.md
```

## Run

From the repository root on macOS or Linux, set up once and then run either
task independently:

```bash
./scripts/resume/setup.sh
./scripts/resume/build.sh
./scripts/update-projects.sh
```

You can also run these from inside `scripts/resume`:

```bash
./setup.sh
./build.sh
python3 build.py --only projects --output-dir /path/to/preview
```

`build.sh` writes the three PDFs to `resume/`. Pass options through to `build.py`,
for example `./scripts/resume/build.sh --only projects`. To refresh the project
PDF and profile table together, run:

```bash
./scripts/resume/build.sh --only projects
./scripts/update-projects.sh
```

The table script replaces only the text between the `PROJECTS` comment markers
in the root README. It reads current project YAML files, preserving other
README sections. PDF metadata uses a fixed creation date and document ID so
unchanged sources with the same dependencies produce identical files.
Downloaded DejaVu fonts and their license stay in ignored `scripts/resume/fonts/`.

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

Keep the YAML and image basenames identical. Add the project's slug to one
`profile_groups` category in `projects/index.yaml` to show it under that
heading in the GitHub table. Edit the category heading or add a category
there when needed.
`pdf_pages` selects twelve of those cards and groups them four per PDF page.
A card can appear in the profile without appearing in the PDF; Shoomi's
HomePage currently does. The builder checks filenames, image existence,
page counts, and duplicate entries before publishing the new PDFs.

Change `scripts/resume/resume.yaml` to edit resume copy or the `output_date`
prefix, and `scripts/resume/letter.yaml` to edit the introduction letter. If
`output_date` changes,
update the three career-document links in the root README after rebuilding.
Review each PDF visually after changing descriptions or images; a long card
can overflow its page.
