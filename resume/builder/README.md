# Resume PDF builder

Download and install fonts:

```bash
python3 download_fonts.py
python3 build.py
```

| file | description |
| --- | --- |
| build.py | |
| resume.yaml | contact, skills, jobs, selected projects |
| letter.yaml | dated introduction letter |
| projects.yaml | portfolio cards, image paths, links |
| requirements.txt | |
| fonts/ | Vera font |

The three YAML text files hold the wording, URLs, titles, and image names.
YAML's folded paragraphs are easier to edit than quoted multiline CSV fields.

## Build on macOS or Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python build.py
```

The three PDFs are written to the repository's `resume/` folder. Update the
root README links when `output_date` changes. Run the last command after any change. To preview without
overwriting the PDFs, pass `--output-dir /path/to/preview`.

## Edit the content

- In `resume.yaml`, change `output_date` to update all three PDF filenames.
  Update the profile, skills, experience, projects, and education there too.
  `experience_page_break_after: 3` starts page two after the third job.
- In `letter.yaml`, update `date` and the paragraphs. This date is separate
  from the filename prefix.
- In `projects.yaml`, each `pages[].projects[]` entry sets the title, image,
  description, and links of one card. There are four cards per page.

Use YAML's folded text syntax for readable multiline descriptions:

```yaml
- title: My project | What it does
  image: ../../projects/my-project.jpg
  description: >-
    First sentence with a clear summary.
    Another sentence about the tech and results.
  links:
    - {label: Live demo, url: 'https://example.com/'}
    - {label: Source, url: 'https://github.com/example/project'}
```

Image paths are relative, so `../../projects/name.jpg`
points to `projects/name.jpg` in the repo. The builder checks all image paths
before writing PDFs and gives a clear error for a missing image.

A long description may overflow a page, so the builder checks page counts and asks
you to adjust the copy or layout before publishing. Open the PDFs for a visual
review after rebuilding.

The bundled DejaVu fonts keep the layout consistent across systems; their
license is in `fonts/LICENSE.txt`.
