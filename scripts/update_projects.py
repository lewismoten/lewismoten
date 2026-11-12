"""Load project cards beside their images and render the profile project table."""

from html import escape as html_escape
import json
from pathlib import Path
import re

import yaml


REPO = Path(__file__).resolve().parent.parent
PROJECTS = REPO / 'projects'
START = '<!-- PROJECTS:START -->'
END = '<!-- PROJECTS:END -->'
SITE = 'https://lewismoten.github.io'
SITE_PROJECTS = REPO / 'site' / 'content' / 'projects.json'


def site_pages():
    """Slugs that have a More details page on the portfolio site (site/)."""
    if not SITE_PROJECTS.is_file():
        return set()
    with SITE_PROJECTS.open(encoding='utf-8') as stream:
        return {project['slug'] for project in json.load(stream)['projects']}


def read_yaml(path):
    with path.open(encoding='utf-8') as stream:
        result = yaml.safe_load(stream)
    if not isinstance(result, dict):
        raise ValueError(f'{path} must contain a YAML mapping')
    return result


def load_catalog():
    index = read_yaml(PROJECTS / 'index.yaml')
    profile_groups = index['profile_groups']
    if not isinstance(profile_groups, list) or not profile_groups:
        raise ValueError('profile_groups needs at least one category')
    headings = [group['heading'] for group in profile_groups]
    if any(not isinstance(heading, str) or not heading.strip() for heading in headings):
        raise ValueError('Each profile group needs a heading')
    if len(headings) != len(set(headings)):
        raise ValueError('Duplicate heading in profile_groups')
    if any(not isinstance(group['projects'], list) or not group['projects']
           for group in profile_groups):
        raise ValueError('Each profile group needs at least one project')
    profile_order = [slug for group in profile_groups for slug in group['projects']]
    pdf_pages = index['pdf_pages']
    all_slugs = profile_order + [slug for page in pdf_pages for slug in page['projects']]
    if len(profile_order) != len(set(profile_order)):
        raise ValueError('Duplicate slug in profile_groups')
    cards = {}
    for slug in set(all_slugs):
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', slug):
            raise ValueError(f'Invalid project slug: {slug!r}')
        path = PROJECTS / f'{slug}.yaml'
        card = read_yaml(path)
        image = card['image']
        if Path(image).name != image or Path(image).stem != slug:
            raise ValueError(f'{path}: image must be {slug}.jpg beside this YAML file')
        image_path = PROJECTS / image
        if not image_path.is_file():
            raise FileNotFoundError(f'{path}: missing {image_path}')
        if not card.get('links'):
            raise ValueError(f'{path}: add at least one link')
        card['image_path'] = image_path
        cards[slug] = card
    unlisted = {path.stem for path in PROJECTS.glob('*.yaml')} - {'index'} - set(profile_order)
    if unlisted:
        raise ValueError(f'Project files missing from profile_groups: {sorted(unlisted)}')
    for page in pdf_pages:
        if len(page['projects']) != 4:
            raise ValueError(f"{page['kicker']}: PDF pages need exactly four project cards")
        if len(page['projects']) != len(set(page['projects'])):
            raise ValueError(f"{page['kicker']}: duplicate project card")
    return index, cards


# GitHub shrinks a table's image column to fit long text beside it, and the img width
# attribute does not stop it; non-breaking spaces cannot wrap, so they hold the column open.
SPACER = '&nbsp;' * 48


def markdown_link(label, url):
    return f'[{label}]({url})'


def project_table(index, cards):
    pages = site_pages()
    lines = []
    for group in index['profile_groups']:
        lines += [f"### {group['heading']}", '', f'| Project image{SPACER} | Project |',
                  '| :--- | :--- |']
        for slug in group['projects']:
            card = cards[slug]
            source = next((link['url'] for link in card['links']
                           if link['label'] == 'Source'), card['links'][0]['url'])
            image = f'./projects/{card["image"]}'
            # A fixed width keeps every image the same size; GitHub shrinks a table column
            # beside long text otherwise.
            alt = html_escape(card['name'])
            preview = f'<a href="{source}"><img src="{image}" alt="{alt}" width="240"></a>'
            title = html_escape(card['title'], quote=False).replace('|', r'\|')
            description = html_escape(card['description'], quote=False)
            all_links = [(link['label'], link['url']) for link in card['links']]
            page = card.get('site_slug', slug)
            if page in pages:
                all_links.append(('More details', f'{SITE}/projects/{page}/'))
            links = ' · '.join(markdown_link(label, url) for label, url in all_links)
            lines.append(f'| {preview} | **{title}**<br>{description}<br>{links} |')
        lines.append('')
    return '\n'.join(lines).rstrip()


def update_readme(index, cards):
    path = REPO / 'README.md'
    original = path.read_text(encoding='utf-8')
    if original.count(START) != 1 or original.count(END) != 1:
        raise ValueError(f'{path}: expected one {START} and one {END}')
    before, rest = original.split(START, 1)
    _, after = rest.split(END, 1)
    updated = before + START + '\n' + project_table(index, cards) + '\n' + END + after
    if updated != original:
        path.write_text(updated, encoding='utf-8')
    return updated != original


if __name__ == '__main__':
    manifest, projects = load_catalog()
    changed = update_readme(manifest, projects)
    print('Updated README.md projects table' if changed else 'README.md projects table is current')
