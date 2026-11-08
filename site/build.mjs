// Builds the static site into docs/ from content/projects.json, content/posts/*.md and site.json.
// No dependencies. Run: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, '..', 'docs');
const site = JSON.parse(readFileSync(join(ROOT, 'site.json'), 'utf8'));
const { groups, projects, groupNotes = {}, series = [] } = JSON.parse(readFileSync(join(ROOT, 'content/projects.json'), 'utf8'));
const BASE = site.url;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Small Markdown: paragraphs, "- " lists, **bold**, *italic*, `code`, [text](url).
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);
}
function markdown(src) {
  return src
    .trim()
    .split(/\n{2,}/)
    .map((block) =>
      /^- /.test(block)
        ? `<ul>${block.split('\n').map((l) => `<li>${inline(l.replace(/^- /, ''))}</li>`).join('')}</ul>`
        : `<p>${inline(block.replace(/\n/g, ' '))}</p>`,
    )
    .join('\n');
}

function parsePost(file) {
  const raw = readFileSync(join(ROOT, 'content/posts', file), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const fm = { images: [] };
  for (const line of m[1].split('\n')) {
    const img = line.match(/^\s+- src: (.+)$/);
    if (img) {
      const [src, alt, w, h, pixel] = img[1].split(' | ').map((x) => x.trim());
      fm.images.push({ src, alt, w: +w, h: +h, pixel: pixel === 'pixel' });
      continue;
    }
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv && kv[1] !== 'images') fm[kv[1]] = kv[2];
  }
  for (const k of ['title', 'date', 'project']) if (!fm[k]) throw new Error(`${file}: missing ${k}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.date)) throw new Error(`${file}: date must be YYYY-MM-DD`);
  if (!projects.some((p) => p.slug === fm.project)) throw new Error(`${file}: unknown project ${fm.project}`);
  fm.slug = file.replace(/\.md$/, '');
  fm.html = markdown(m[2]);
  fm.text = m[2].trim().replace(/\s+/g, ' ');
  return fm;
}
const posts = readdirSync(join(ROOT, 'content/posts'))
  .filter((f) => f.endsWith('.md'))
  .map(parsePost)
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

for (const p of projects) {
  if (!groups.includes(p.group)) throw new Error(`${p.slug}: unknown group`);
  for (const k of ['pitch', 'problem', 'built', 'role']) if (!p[k]) throw new Error(`${p.slug}: missing ${k}`);
}
const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));

const dateLabel = (d) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const heroOf = (p) => `/img/projects/${p.slug}.jpg`;
const miniOf = (p) => `/img/projects/${p.slug}-sm.jpg`;
const miniSrc = (src) => (/^\/img\/projects\/[^/]+\.jpg$/.test(src) ? src.replace(/\.jpg$/, '-sm.jpg') : src);

// ---------- page shell ----------
function page({ path, title, description, image = '/img/social-preview.jpg', body, type = 'website', fullTitle, noindex = false }) {
  const url = BASE + path;
  const t = fullTitle || (path === '/' ? title : `${title} | ${site.name}`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(t)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE + image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${BASE + image}">
<link rel="alternate" type="application/atom+xml" title="${esc(site.name)} posts" href="/feed.xml">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
<div class="wrap bar">
<a class="brand" href="/">${esc(site.name)}</a>
<nav aria-label="Main">
<ul>
${site.nav.map((n) => `<li><a href="${n.href}"${path === n.href || (n.href !== '/' && path.startsWith(n.href)) ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('\n')}
</ul>
</nav>
<button class="theme" type="button" id="theme">Theme</button>
</div>
</header>
<main id="main" class="wrap">
${body}
</main>
<footer class="foot">
<div class="wrap">
<p>${esc(site.footer)} <a href="/feed.xml">Posts feed</a></p>
</div>
</footer>
<script src="/theme.js" defer></script>
</body>
</html>
`;
}

const link = (href, label) => `<a href="${esc(href)}">${esc(label)}</a>`;
const img = (src, alt, w, h, extra = '') => `<img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async"${extra}>`;

function projectLinks(p) {
  const l = p.links || {};
  const out = [];
  if (l.demo) out.push(['Live demo', l.demo]);
  if (l.source) out.push(['Source', l.source]);
  for (const k of ['other', 'video', 'press']) for (const x of l[k] || []) out.push([x.label, x.url]);
  return out;
}

function card(p) {
  return `<li class="card" data-tags="${esc(p.tags.join('|'))}">
<a class="cardimg" href="/projects/${p.slug}/" tabindex="-1" aria-hidden="true">${img(miniOf(p), '', 320, 160)}</a>
<div class="cardbody">
<h3><a href="/projects/${p.slug}/">${esc(p.title)}</a></h3>
<p class="sub">${esc(p.subtitle)}</p>
<p>${esc(p.pitch)}</p>
<p class="tags">${p.tags.slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join('')}</p>
<p class="more"><a href="/projects/${p.slug}/">More details<span class="vh"> about ${esc(p.title)}</span></a></p>
</div>
</li>`;
}

function postBlock(post, { mini = false, heading = 'h3' } = {}) {
  const p = bySlug[post.project];
  const imgs = post.images
    .map((i) => {
      const src = mini ? miniSrc(i.src) : i.src;
      const w = mini && src !== i.src ? 320 : i.w;
      const h = mini && src !== i.src ? 160 : i.h;
      return `<li>${img(src, i.alt, w, h, i.pixel ? ' class="pixel"' : '')}</li>`;
    })
    .join('');
  const more = post.blog ? link(post.blog, 'Read the full post on my blog') : post.link ? link(post.link, post.linklabel || 'Open it') : '';
  return `<article class="post">
<${heading}><a href="/posts/${post.slug}/">${esc(post.title)}</a></${heading}>
<p class="meta"><time datetime="${post.date}">${dateLabel(post.date)}</time> · Project: <a href="/projects/${p.slug}/">${esc(p.title)}</a></p>
<ul class="shots${mini ? ' mini' : ''}">${imgs}</ul>
${post.html}
${more ? `<p>${more}</p>` : ''}
</article>`;
}

// ---------- pages ----------
const pages = [];
const add = (path, html) => pages.push({ path, html });

// Home
{
  const startHere = site.startHere
    .map((s) => `<li><strong>${esc(s.label)}:</strong> ${link(s.href, s.title)} — ${esc(s.text)}</li>`)
    .join('\n');
  const featured = projects.filter((p) => p.featured);
  add(
    '/',
    page({
      path: '/',
      title: `${site.name} | ${site.headline}`,
      description: site.description,
      body: `<section class="hero">
<h1>${esc(site.name)}</h1>
<p class="lede">${esc(site.headline)}</p>
${site.intro.map((x) => `<p>${esc(x)}</p>`).join('\n')}
<p class="cta"><a class="btn" href="/projects/">See the projects</a> ${link(site.links.career, 'Career history')}</p>
</section>
<section aria-labelledby="start"><h2 id="start">Start here</h2><ul class="plain">${startHere}</ul></section>
<section aria-labelledby="feat"><h2 id="feat">Featured projects</h2>
<ul class="grid">${featured.map(card).join('\n')}</ul>
<p><a href="/projects/">All ${projects.length} projects</a></p></section>
<section aria-labelledby="latest"><h2 id="latest">Latest posts</h2>
${posts.slice(0, 3).map((p) => postBlock(p, { mini: true })).join('\n')}
<p><a href="/posts/">All posts</a></p></section>
<section aria-labelledby="contact"><h2 id="contact">Contact</h2>
<ul class="plain">
<li>${link('mailto:' + site.email, site.email)}</li>
<li>${link(site.links.linkedin, 'LinkedIn')}</li>
<li>${link(site.links.calendly, 'Schedule a conversation')}</li>
</ul>
<p>Career documents: ${site.resume.map((r) => link(r.href, r.label + ' (PDF)')).join(' · ')}</p>
</section>`,
    }),
  );
}

// Projects index
{
  const tagCount = {};
  for (const p of projects) for (const t of p.tags) tagCount[t] = (tagCount[t] || 0) + 1;
  const tags = Object.keys(tagCount).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  add(
    '/projects/',
    page({
      path: '/projects/',
      title: 'Projects',
      description: `${projects.length} public projects: applied AI, browser tools, interactive publishing, Commodore 64 software, and government transparency.`,
      body: `<h1>Projects</h1>
<p>Public work with live demos and source. Each one has a More details page with an executive summary and a technical overview.</p>
<div class="filter" id="filter" hidden>
<label for="tagsel">Filter by tag</label>
<select id="tagsel"><option value="">All tags</option>${tags.map((t) => `<option value="${esc(t)}">${esc(t)} (${tagCount[t]})</option>`).join('')}</select>
<span id="filtercount" role="status" aria-live="polite"></span>
</div>
${groups
  .map(
    (g) => `<section class="group" aria-labelledby="g-${groups.indexOf(g)}"><h2 id="g-${groups.indexOf(g)}">${esc(g)}</h2>${groupNotes[g] ? `\n<p>${inline(groupNotes[g])}</p>` : ''}
<ul class="grid">${projects.filter((p) => p.group === g).map(card).join('\n')}</ul></section>`,
  )
  .join('\n')}
<script src="/filter.js" defer></script>`,
    }),
  );
}

// Project pages
// A numbered strip linking the projects of a series, with the current one marked.
function seriesStrip(p) {
  const s = series.find((x) => x.slugs.includes(p.slug));
  if (!s) return '';
  const items = s.slugs
    .map((slug, i) => {
      const q = bySlug[slug];
      return slug === p.slug ? `<li aria-current="page"><strong>${i + 1}. ${esc(q.title)}</strong></li>` : `<li><a href="/projects/${slug}/">${i + 1}. ${esc(q.title)}</a></li>`;
    })
    .join('');
  const name = s.page ? `<a href="/series/${s.page}/">${esc(s.name)}</a>` : esc(s.name);
  return `<nav class="series" aria-label="${esc(s.name)}"><p>Part of a series: ${name}</p><ol>${items}</ol></nav>\n`;
}
for (const p of projects) {
  const rel = posts.filter((x) => x.project === p.slug);
  // Two parts: a plain summary for someone deciding, then how it works for someone technical.
  const part = (title, subs) => {
    const body = subs.filter(([, v]) => v).map(([h, v]) => `<h3>${h}</h3>${markdown(v)}`).join('\n');
    return body ? `<section class="part" id="${title.toLowerCase().replace(/ /g, '-')}"><h2>${title}</h2>\n${body}</section>` : '';
  };
  const stack = `<ul class="tags plain-tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
  const sections = [
    part('Executive summary', [
      ['Why it exists', p.problem],
      ['Outcome', p.results],
      ['My role', p.role],
    ]),
    part('Technical overview', [
      ['How it works', p.built],
      ['Hard parts', p.hard],
      ['How it was made', p.made],
    ]).replace(/<\/section>$/, `<h3>Stack</h3>\n${stack}</section>`),
  ];
  add(
    `/projects/${p.slug}/`,
    page({
      path: `/projects/${p.slug}/`,
      title: `${p.title}: ${p.subtitle}`,
      description: p.pitch,
      image: heroOf(p),
      type: 'article',
      body: `<nav aria-label="Breadcrumb" class="crumb"><a href="/projects/">Projects</a> / ${esc(p.group)}</nav>
<article class="project">
<h1>${esc(p.title)}</h1>
<p class="sub">${esc(p.subtitle)}</p>
<img class="hero-img" src="${heroOf(p)}" alt="${esc(p.alt)}" width="640" height="320" decoding="async" fetchpriority="high">
<p class="lede">${esc(p.pitch)}</p>
<p class="links">${projectLinks(p).map(([l, u]) => `<a class="btn" href="${esc(u)}">${esc(l)}</a>`).join(' ')}</p>
${seriesStrip(p)}<nav class="toc" aria-label="On this page"><a href="#executive-summary">Executive summary</a> · <a href="#technical-overview">Technical overview</a></nav>
${sections.join('\n')}
${rel.length ? `<section><h2>Posts about it</h2><ul class="plain">${rel.map((x) => `<li><time datetime="${x.date}">${dateLabel(x.date)}</time> — <a href="/posts/${x.slug}/">${esc(x.title)}</a></li>`).join('')}</ul></section>` : ''}
</article>`,
    }),
  );
}

// Series pages: a side-by-side table of the projects and what each step taught the next.
for (const s of series.filter((x) => x.page)) {
  const c = JSON.parse(readFileSync(join(ROOT, 'content/series', `${s.page}.json`), 'utf8'));
  const head = `<tr><th scope="col"><span class="vh">Property</span></th>${s.slugs.map((slug, i) => `<th scope="col"><a href="/projects/${slug}/">${esc(c.columns[i])}</a></th>`).join('')}</tr>`;
  const rows = c.rows.map(([label, ...cells]) => `<tr><th scope="row">${esc(label)}</th>${cells.map((x) => `<td>${inline(x)}</td>`).join('')}</tr>`).join('\n');
  const path = `/series/${s.page}/`;
  add(
    path,
    page({
      path,
      title: c.title,
      description: c.description,
      image: heroOf(bySlug[s.slugs[s.slugs.length - 1]]),
      type: 'article',
      body: `<nav aria-label="Breadcrumb" class="crumb"><a href="/projects/">Projects</a> / Series</nav>
<article class="project">
<h1>${esc(c.title)}</h1>
${c.intro.map((x) => `<p${x === c.intro[0] ? ' class="lede"' : ''}>${inline(x)}</p>`).join('\n')}
${c.origins ? `<section class="part"><h2>${esc(c.origins.title)}</h2><ul>${c.origins.items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></section>` : ''}
<section class="part"><h2>Side by side</h2>
<div class="tablewrap" tabindex="0" role="region" aria-label="${esc(c.title)} compared"><table class="compare">
<thead>${head}</thead>
<tbody>${rows}</tbody>
</table></div></section>
<section class="part"><h2>What each step taught the next</h2>
${c.steps.map((x, i) => `<h3><a href="/projects/${s.slugs[i]}/">${esc(x.title)}</a></h3>${markdown(x.text)}`).join('\n')}
</section>
<p class="note">${inline(c.notes)}</p>
</article>`,
    }),
  );
}

// Posts index + pages
add(
  '/posts/',
  page({
    path: '/posts/',
    title: 'Posts',
    description: 'Short, dated project updates with screenshots. Long write-ups are on my blog.',
    body: `<h1>Posts</h1>
<p>Short, dated updates with screenshots. The long write-ups are on <a href="${site.links.blog}">my blog</a>. <a href="/feed.xml">Subscribe with the feed.</a></p>
${posts.map((p) => postBlock(p, { heading: "h2" })).join('\n')}`,
  }),
);
for (const post of posts) {
  const first = post.images[0];
  add(
    `/posts/${post.slug}/`,
    page({
      path: `/posts/${post.slug}/`,
      title: post.title,
      description: post.text.slice(0, 200),
      image: first && first.src.startsWith('/img/projects/') ? first.src : '/img/social-preview.jpg',
      type: 'article',
      body: `<nav aria-label="Breadcrumb" class="crumb"><a href="/posts/">Posts</a></nav>${postBlock(post, { heading: 'h1' }).replace(
        /<h1><a [^>]*>(.*?)<\/a><\/h1>/,
        '<h1>$1</h1>',
      )}`,
    }),
  );
}

// About
add(
  '/about/',
  page({
    path: '/about/',
    title: 'About',
    description: site.description,
    body: `<h1>About</h1>
${site.about.map((x) => `<p>${inline(x)}</p>`).join('\n')}
<h2>What I work with</h2>
<ul>${site.skills.map((s) => `<li><strong>${esc(s.label)}:</strong> ${esc(s.text)}</li>`).join('')}</ul>
<h2>Experience highlights</h2>
<ul>${site.experience.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>
<h2>Community and leadership</h2>
<ul>${site.community.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>
<h2>Career history</h2>
<p>The full <a href="${site.links.career}">career history</a> is on my site. My <a href="${site.resume[1].href}">resume (PDF)</a> and the other career documents are linked below.</p>
<p>${site.resume.map((r) => link(r.href, r.label + ' (PDF)')).join(' · ')}</p>
<h2>Beyond code</h2>
${site.beyond.map((x) => `<p>${inline(x)}</p>`).join('\n')}
<h2>Packages on npm</h2>
<ul>${site.packages.map((p) => `<li>${link('https://www.npmjs.com/package/' + p.name, p.name)}: ${esc(p.text)}</li>`).join('')}</ul>
<h2>Profiles</h2>
<ul class="plain"><li>${link(site.links.github, 'GitHub')}</li><li>${link(site.links.huggingface, 'Hugging Face')} (models and a dataset)</li><li>${link(site.links.ollama, 'Ollama')}</li><li>${link(site.links.npm, 'npm')}</li></ul>
<h2>Contact</h2>
<ul class="plain"><li>${link('mailto:' + site.email, site.email)}</li><li>${link(site.links.linkedin, 'LinkedIn')}</li><li>${link(site.links.calendly, 'Schedule a conversation')}</li></ul>`,
  }),
);

// ---------- feed, sitemap, 404, robots ----------
const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>${esc(site.name)}: posts</title>
<subtitle>Short, dated project updates.</subtitle>
<link href="${BASE}/feed.xml" rel="self"/>
<link href="${BASE}/posts/"/>
<id>${BASE}/posts/</id>
<updated>${posts[0].date}T12:00:00Z</updated>
<author><name>${esc(site.name)}</name></author>
${posts
  .map(
    (p) => `<entry>
<title>${esc(p.title)}</title>
<link href="${BASE}/posts/${p.slug}/"/>
<id>${BASE}/posts/${p.slug}/</id>
<updated>${p.date}T12:00:00Z</updated>
<summary>${esc(p.text)}</summary>
</entry>`,
  )
  .join('\n')}
</feed>
`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `<url><loc>${BASE}${p.path}</loc></url>`).join('\n')}
</urlset>
`;
const notFound = page({
  path: '/404.html',
  title: 'Page not found',
  description: 'That page is not here.',
  noindex: true,
  body: `<h1>Page not found</h1><p>That page is not here. Try the <a href="/">home page</a>, the <a href="/projects/">projects</a>, or the <a href="/posts/">posts</a>.</p>`,
});

// ---------- write ----------
// Root links ("/projects/x/") become relative ("../x/index.html") so the built pages also open
// straight from the file system; "index.html" is spelled out because file:// has no directory index.
// The 404 page is served at any depth, so its links point at the full site URL instead.
function relativize(html, path) {
  const depth = path.split('/').filter(Boolean).length - (path.endsWith('/') ? 0 : 1);
  const up = depth ? '../'.repeat(depth) : './';
  return html.replace(/(href|src)="\/(?!\/)([^"#?]*)([^"]*)"/g, (_, attr, target, rest) => {
    const file = target === '' || target.endsWith('/') ? `${target}index.html` : target;
    return `${attr}="${up}${file}${rest}"`;
  });
}
const absolutize = (html) => html.replace(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const p of pages) {
  const dir = join(OUT, p.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), relativize(p.html, p.path));
}
writeFileSync(join(OUT, '404.html'), absolutize(notFound));
writeFileSync(join(OUT, 'feed.xml'), feed);
writeFileSync(join(OUT, 'sitemap.xml'), sitemap);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
writeFileSync(join(OUT, '.nojekyll'), '');
cpSync(join(ROOT, 'static'), OUT, { recursive: true });
cpSync(join(ROOT, 'img'), join(OUT, 'img'), { recursive: true });
console.log(`built ${pages.length + 1} pages, ${projects.length} projects, ${posts.length} posts -> ../docs/`);
