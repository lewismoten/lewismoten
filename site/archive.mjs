// The Archive pages (/archive/ and /archive/psc/) and the tag filter shared with Projects.
// Data: content/archive-repos.json (one entry per public repository) and content/archive-psc.json
// (scripts published to Planet Source Code, 2000-2004).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PSC_REPO = 'https://github.com/lewismoten/Lewies-Code-Library-PSC';
const PSC_BRANCH = 'master';
const SHOWN_TAGS = 12;

// The tag cloud, search box and count shared by Projects and Archive. Without JavaScript the
// whole control stays hidden and every item shows. static/filter.js drives it.
export function filterUi(tagCount, noun, esc) {
  const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }));
  const max = tags[0] ? tags[0][1] : 1;
  const btn = ([t, n], i) =>
    `<li><button type="button" class="tagbtn w${Math.min(3, Math.ceil((n / max) * 3))}" data-tag="${esc(t)}" data-i="${i}" aria-pressed="false">${esc(t)} <span class="n">${n}</span></button></li>`;
  return `<div class="filter" id="filter" data-noun="${esc(noun)}" data-shown="${SHOWN_TAGS}" hidden>
<div class="frow"><label for="fsearch">Search</label><input type="search" id="fsearch" autocomplete="off" placeholder="Search ${esc(noun)}s and tags"></div>
<ul class="tagcloud" id="tagcloud" aria-label="Tags, most used first">${tags.map(btn).join('')}</ul>
<p class="frow"><button type="button" class="more-btn" id="tagmore" aria-expanded="false">Show all tags (${tags.length})</button>
<span id="activetag" hidden>Showing tag <strong id="activename"></strong> <button type="button" class="more-btn" id="tagclear">Clear</button></span></p>
<p id="filtercount" class="sub" role="status" aria-live="polite"></p>
</div>`;
}

export function archivePages({ esc, img, projects }) {
  const read = (f) => JSON.parse(readFileSync(join(import.meta.dirname, 'content', f), 'utf8'));
  const repos = read('archive-repos.json');
  const psc = read('archive-psc.json');
  const featured = Object.fromEntries(
    projects.map((p) => [(p.links?.source || '').replace(/^https:\/\/github\.com\/lewismoten\/([^/]+)$/i, '$1').toLowerCase(), p]),
  );
  const years = (r) => (r.origin === r.last ? r.origin : `${r.origin}–${r.last}`);
  const thumbOf = (r, f) => (f ? `/img/projects/${f.slug}-sm.jpg` : r.thumb ? `/img/archive/${r.name}.jpg` : '/img/social-preview.jpg');

  const tagCount = {};
  for (const r of repos) for (const t of r.topics) tagCount[t] = (tagCount[t] || 0) + 1;

  function row(r) {
    const isPsc = r.name === 'Lewies-Code-Library-PSC';
    const f = featured[r.name.toLowerCase()];
    const href = isPsc ? '/archive/psc/' : `https://github.com/lewismoten/${r.name}`;
    const alt = f ? `Preview of ${f.title}` : r.thumb ? `Social preview of ${r.name}` : '';
    const image = img(thumbOf(r, f), alt, 320, 160).replace(/width="320"/, 'width="320" class="athumb"');
    const lang = r.language ? `<span>${esc(r.language)}</span>` : '';
    const live = r.pages && r.homepage ? ` <a href="${esc(r.homepage)}">Live<span class="vh"> site for ${esc(r.name)}</span></a>` : '';
    const feat = f ? ` <a class="badge" href="/projects/${f.slug}/">Featured<span class="vh">: case study of ${esc(r.name)}</span></a>` : '';
    return `<li class="arow" data-tags="${esc(r.topics.join('|'))}">
<div class="athumbbox">${image}</div>
<div class="abody">
<h3><a href="${esc(href)}">${esc(r.name)}</a>${isPsc ? ' <span class="sub">(scripts, 2000–2004)</span>' : ''}</h3>
<p>${esc(r.description)}</p>
<p class="ameta">${years(r)}${lang ? ' · ' + lang : ''}${live ? ' ·' + live : ''}${feat ? ' ·' + feat : ''}</p>
${r.topics.length ? `<p class="tags">${r.topics.map((t) => `<span>${esc(t)}</span>`).join('')}</p>` : ''}
</div>
</li>`;
  }

  const sorted = [...repos].sort((a, b) => b.origin.localeCompare(a.origin) || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  const yrs = [...new Set(sorted.map((r) => r.origin))];
  const shown = repos.length;
  const archive = {
    path: '/archive/',
    title: 'Archive',
    description: `Every public repository, newest first by the year it began: ${shown} projects from 2000 to today.`,
    body: `<h1>Archive</h1>
<p>Everything else, by year it began. These are my public repositories, from this year back to scripts I published in 2000. The ones I wrote up as case studies are marked Featured. Years run from the first commit to the last one.</p>
${filterUi(tagCount, 'project', esc)}
${yrs
  .map(
    (y) => `<section class="group" aria-labelledby="y-${y}"><h2 id="y-${y}">${y}</h2>
<ul class="alist">${sorted.filter((r) => r.origin === y).map(row).join('\n')}</ul></section>`,
  )
  .join('\n')}
<script src="/filter.js" defer></script>`,
  };

  // PSC page
  const langs = {};
  for (const e of psc) (langs[e.language] ||= []).push(e);
  const order = Object.keys(langs).sort((a, b) => langs[b].length - langs[a].length);
  const clean = (s) => esc(s.replace(/\s+/g, ' ').trim()).replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '(email removed)');
  const short = (s) => {
    const t = s.replace(/\s+/g, ' ').trim();
    return t.length > 200 ? t.slice(0, t.lastIndexOf(' ', 200)) + '…' : t;
  };
  const pscPage = {
    path: '/archive/psc/',
    title: 'Scripts, 2000 to 2004',
    description: `${psc.length} scripts I published between 2000 and 2004, before GitHub, grouped by language.`,
    body: `<nav aria-label="Breadcrumb" class="crumb"><a href="/archive/">Archive</a> / Scripts</nav>
<h1>Scripts, 2000 to 2004</h1>
<p>An archive of scripts I published from 2000 to 2004, before GitHub. I kept them in a repository, <a href="${PSC_REPO}">Lewies-Code-Library-PSC</a>. This is a selection of ${psc.length}. They are old code, kept as they were.</p>
<ul class="plain-tags">${order.map((l) => `<li><a href="#${l.replace(/\W+/g, '-').toLowerCase()}">${esc(l)}: ${langs[l].length}</a></li>`).join('')}</ul>
${order
  .map((l) => {
    const id = l.replace(/\W+/g, '-').toLowerCase();
    const items = langs[l].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    return `<section class="part" aria-labelledby="${id}"><h2 id="${id}">${esc(l)} (${items.length})</h2>
<div class="tablewrap"><table class="compare psc"><thead><tr><th scope="col">Title</th><th scope="col">Date</th><th scope="col">What it does</th><th scope="col">Code</th></tr></thead><tbody>
${items
  .map(
    (e) =>
      `<tr><th scope="row">${clean(e.title)}</th><td>${esc(e.date)}</td><td>${clean(short(e.description))}</td><td><a href="${PSC_REPO}/blob/${PSC_BRANCH}/${encodeURI(e.path)}">Files<span class="vh"> for ${esc(e.title)}</span></a></td></tr>`,
  )
  .join('\n')}
</tbody></table></div></section>`;
  })
  .join('\n')}`,
  };
  return { pages: [archive, pscPage], count: shown };
}
