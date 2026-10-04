"""Load project cards beside their images and render the profile project table."""

from html import escape as html_escape
from pathlib import Path
import re

import yaml


REPO = Path(__file__).resolve().parents[2]
PROJECTS = REPO / 'projects'
START = '<!-- PROJECTS:START -->'
END = '<!-- PROJECTS:END -->'


def read_yaml(path):
    with path.open(encoding='utf-8') as stream:
        result = yaml.safe_load(stream)
    if not isinstance(result, dict):
        raise ValueError(f'{path} must contain a YAML mapping')
    return result


def load_catalog():
    index = read_yaml(PROJECTS / 'index.yaml')
    profile_order = index['profile_order']
    pdf_pages = index['pdf_pages']
    all_slugs = profile_order + [slug for page in pdf_pages for slug in page['projects']]
    if len(profile_order) != len(set(profile_order)):
        raise ValueError('Duplicate slug in profile_order')
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
        raise ValueError(f'Project files missing from profile_order: {sorted(unlisted)}')
    for page in pdf_pages:
        if len(page['projects']) != 4:
            raise ValueError(f"{page['kicker']}: PDF pages need exactly four project cards")
        if len(page['projects']) != len(set(page['projects'])):
            raise ValueError(f"{page['kicker']}: duplicate project card")
    return index, cards


def markdown_link(label, url):
    return f'[{label}]({url})'


def project_table(index, cards):
    lines = ['| Project image | Project |', '| :--- | :--- |']
    for slug in index['profile_order']:
        card = cards[slug]
        source = next((link['url'] for link in card['links']
                       if link['label'] == 'Source'), card['links'][0]['url'])
        image = f'./projects/{card["image"]}'
        preview = f'[![{card["name"]}]({image})]({source})'
        title = html_escape(card['title'], quote=False).replace('|', r'\|')
        description = html_escape(card['description'], quote=False)
        links = ' · '.join(markdown_link(link['label'], link['url'])
                           for link in card['links'])
        lines.append(f'| {preview} | **{title}**<br>{description}<br>{links} |')
    return '\n'.join(lines)


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
