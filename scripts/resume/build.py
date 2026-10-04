#!/usr/bin/env python3
"""Build the three career PDFs from editable YAML and repo project images."""

from argparse import ArgumentParser
from html import escape
from pathlib import Path
import sys

# Allow `python3 build.py` from scripts/resume as well as the shell wrapper.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from update_projects import load_catalog, update_readme

import yaml
from PIL import Image as PILImage
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, HRFlowable, Image, KeepTogether, PageBreak,
    PageTemplate, Paragraph, Spacer, Table, TableStyle,
)
BASE = Path(__file__).resolve().parent
REPO = BASE.parent.parent
pdfmetrics.registerFont(TTFont('DejaVu', str(BASE / 'fonts/DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-Bold', str(BASE / 'fonts/DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold')

INK = colors.HexColor('#182330')
BLUE = colors.HexColor('#174d70')
MUTED = colors.HexColor('#556879')
RULE = colors.HexColor('#cbd7df')


def read_yaml(filename):
    with (BASE / filename).open(encoding='utf-8') as stream:
        data = yaml.safe_load(stream)
    if not isinstance(data, dict):
        raise ValueError(f'{filename} must contain a YAML mapping')
    return data


def style(name, size, leading, *, bold=False, color=INK, before=0, after=0, indent=0):
    return ParagraphStyle(
        name, fontName='DejaVu-Bold' if bold else 'DejaVu',
        fontSize=size, leading=leading, textColor=color,
        spaceBefore=before, spaceAfter=after, leftIndent=indent,
        allowWidows=0, allowOrphans=0, alignment=TA_LEFT,
    )


NAME = style('Name', 20, 23, bold=True, color=BLUE, after=2)
TAGLINE = style('Tagline', 10, 13, bold=True, after=6)
CONTACT = style('Contact', 8.4, 12, color=MUTED, after=2)
SECTION = style('Section', 9.25, 12, bold=True, color=BLUE, before=10, after=4)
BODY = style('Body', 8.7, 12.7, after=3)
SMALL = style('Small', 8.45, 12.1, after=2)
ROLE = style('Role', 9.05, 12.8, bold=True, after=2)
BULLET = style('Bullet', 8.55, 12.2, after=3, indent=12)
LETTER_BODY = style('LetterBody', 10.2, 16, after=12)
LETTER_SMALL = style('LetterSmall', 9.3, 14, color=MUTED)


def para(markup, text_style=BODY):
    return Paragraph(markup, text_style)


def plain(value):
    return escape(str(value), quote=True)


def link(label, url):
    return f'<link href="{plain(url)}" color="#174d70"><u>{plain(label)}</u></link>'


def section(title):
    return [para(plain(title.upper()), SECTION),
            HRFlowable(width='100%', thickness=.55, color=RULE, spaceAfter=5)]


def bullet(value):
    return Paragraph(plain(value), BULLET, bulletText='•')


class CareerDoc(BaseDocTemplate):
    def __init__(self, filename, kind, page_total=None):
        self.kind = kind
        self.page_total = page_total
        super().__init__(
            str(filename), pagesize=letter, leftMargin=51, rightMargin=51,
            topMargin=45, bottomMargin=43, author='Lewis Moten', invariant=1,
            title={'resume': 'Lewis Moten - Resume',
                   'letter': 'Lewis Moten - Cover Letter',
                   'projects': 'Lewis Moten - Selected Projects'}[kind],
        )
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='main', frames=frame, onPage=self.decorate))

    def decorate(self, canvas, doc):
        canvas.saveState()
        width, _ = letter
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(.45)
        canvas.line(51, 35, width - 51, 35)
        canvas.setFont('DejaVu', 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(51, 23, 'Lewis Moten  |  lewismoten.com')
        if self.page_total is not None:
            canvas.drawRightString(width - 51, 23, f'Page {doc.page} of {self.page_total}')
        canvas.restoreState()


def header(profile, *, model_link=True):
    story = [
        para(plain(profile['name'].upper()), NAME),
        para(plain(profile['tagline']), TAGLINE),
        para(f"{plain(profile['location'])}  •  {plain(profile['phone'])}  •  "
             + link(profile['email'], 'mailto:' + profile['email']), CONTACT),
    ]
    links = profile['links'] if model_link else profile['links'][:2]
    story.append(para('  •  '.join(link(x['label'], x['url']) for x in links), CONTACT))
    return story


def build_resume(out, data):
    story = header(data)
    story += section('Profile')
    story.append(para(plain(data['profile'])))
    story += section('Technical strengths')
    for item in data['strengths']:
        story.append(para(f"<b>{plain(item['label'])}:</b> {plain(item['text'])}", SMALL))
    story += section('Professional experience')
    for index, job in enumerate(data['experience']):
        if index == data.get('experience_page_break_after', 0):
            story.append(PageBreak())
            story += section('Professional experience, continued')
        heading = (f"{plain(job['title'])} <font color=\"#556879\">| "
                   f"{plain(job['organization'])} | {plain(job['dates'])}</font>")
        story.append(KeepTogether([para(heading, ROLE)]
                                  + [bullet(line) for line in job['bullets']]
                                  + [Spacer(1, 2)]))
    story += section('Selected independent projects')
    for project in data['projects']:
        suffix = ''
        if project.get('link'):
            suffix = '  |  ' + link(project['link']['label'], project['link']['url'])
        elif project.get('context'):
            suffix = '  |  ' + plain(project['context'])
        story += [para(f"<b>{plain(project['title'])}</b>{suffix}", ROLE),
                  bullet(project['description'])]
    story += section('Education')
    for school in data['education']:
        story.append(para(f"<b>{plain(school['degree'])}</b>  |  {plain(school['school'])}", SMALL))
    CareerDoc(out, 'resume', page_total=2).build(story)


def build_letter(out, profile, data):
    story = header(profile, model_link=False)
    story += [Spacer(1, 29), para(plain(data['date']), LETTER_SMALL),
              Spacer(1, 18), para(plain(data['salutation']), LETTER_BODY)]
    story += [para(plain(text), LETTER_BODY) for text in data['paragraphs']]
    story += [Spacer(1, 7), para(plain(data['closing']), LETTER_BODY),
              para(f"<b>{plain(data['signature'])}</b>", LETTER_BODY), Spacer(1, 13)]
    story.append(para('  |  '.join(f"{plain(x['label'])}: {link(x['text'], x['url'])}"
                                   for x in data['links']), LETTER_SMALL))
    CareerDoc(out, 'letter').build(story)


def image_for(image_path):
    path = Path(image_path).resolve()
    if not path.is_file():
        raise FileNotFoundError(f'Missing project image: {path}')
    return path


def fit(relative, max_width, max_height):
    path = image_for(relative)
    with PILImage.open(path) as picture:
        width, height = picture.size
    scale = min(max_width / width, max_height / height)
    result = Image(str(path), width=width * scale, height=height * scale)
    result.hAlign = 'LEFT'
    return result


def build_projects(out, data):
    title = style('ProjectIndexTitle', 11.5, 15, bold=True, color=BLUE, after=5)
    description = style('ProjectIndexDescription', 8.05, 11.3, after=5)
    links = style('ProjectIndexLinks', 7.45, 10.6, color=MUTED)
    page_heading = style('IndexPageHeading', 13.4, 17.5, bold=True, color=BLUE, after=7)

    def heading(kicker, heading_text, intro=None, first=False):
        items = []
        if first:
            items += [para('LEWIS MOTEN', NAME), para(plain(data['title']), TAGLINE),
                      para(plain(data['intro']), CONTACT), Spacer(1, 11)]
        items += section(kicker)
        items.append(para(plain(heading_text), page_heading))
        if intro:
            items += [para(plain(intro), SMALL), Spacer(1, 5)]
        return items

    def project_row(item):
        actions = '  |  '.join(link(x['label'], x['url']) for x in item.get('links', []))
        row = Table([[fit(item['image_path'], 220, 110), [
            para(plain(item['title']), title),
            para(plain(item['description']), description),
            para(actions, links),
        ]]], colWidths=[240, 260], rowHeights=[129],
                    style=TableStyle([
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                        ('LEFTPADDING', (0, 0), (-1, -1), 0),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                        ('TOPPADDING', (0, 0), (-1, -1), 2),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                        ('LINEBELOW', (0, 0), (-1, -1), .5, RULE),
                    ]))
        return [row, Spacer(1, 13)]

    story = []
    for index, page in enumerate(data['pages']):
        if index:
            story.append(PageBreak())
        story += heading(page['kicker'], page['heading'], first=index == 0)
        for item in page['projects']:
            story += project_row(item)
    CareerDoc(out, 'projects', page_total=len(data['pages'])).build(story)


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=REPO / 'resume',
                        help='Where PDFs go; default is the repository resume/ folder')
    parser.add_argument('--only', choices=('all', 'resume', 'letter', 'projects'),
                        default='all', help='Build one document or all three')
    parser.add_argument('--update-readme', action='store_true',
                        help='Also regenerate the Projects table in the root README')
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    profile = read_yaml('resume.yaml')
    letter = read_yaml('letter.yaml')
    index, cards = load_catalog()
    projects = {
        'title': index['title'], 'intro': index['intro'],
        'pages': [{**page, 'projects': [cards[slug] for slug in page['projects']]}
                  for page in index['pdf_pages']],
    }
    prefix = profile['output_date']
    outputs = [
        (build_resume, f'{prefix}-resume-for-lewis-moten.pdf', (profile,)),
        (build_letter, f'{prefix}-intro-letter-for-lewis-moten.pdf', (profile, letter)),
        (build_projects, f'{prefix}-selected-projects-for-lewis-moten.pdf', (projects,)),
    ]
    for builder, filename, content in outputs:
        if args.only != 'all' and builder.__name__ != 'build_' + args.only:
            continue
        destination = args.output_dir / filename
        builder(destination, *content)
        expected = {'build_resume': 2, 'build_letter': 1,
                    'build_projects': len(projects['pages'])}[builder.__name__]
        actual = len(PdfReader(destination).pages)
        if actual != expected:
            raise RuntimeError(
                f'{destination} has {actual} pages; the layout expects {expected}. '
                'Check for overflow and adjust the layout/page breaks before publishing.'
            )
        print(destination)
    if args.update_readme:
        changed = update_readme(index, cards)
        print('Updated README.md projects table' if changed else 'README.md projects table is current')


if __name__ == '__main__':
    main()
