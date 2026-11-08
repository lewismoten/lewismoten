// Writes README.md, the repository's front page on GitHub, from site.json and content/projects.json.
// It reads as a profile (picture, intro, projects with their previews), not as build notes;
// those are in DEVELOPING.md. Called by build.mjs.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

function links(p) {
  const l = p.links || {};
  const out = [];
  if (l.demo) out.push(['Live demo', l.demo]);
  if (l.source) out.push(['Source', l.source]);
  for (const k of ['other', 'video', 'press']) for (const x of l[k] || []) out.push([x.label, x.url]);
  return out;
}

export function writeReadme(root, site, groups, projects, groupNotes) {
  const abs = (href) => (href.startsWith('/') ? site.url + href : href);
  const caseStudy = (p) => `${site.url}/projects/${p.slug}/`;
  const L = site.links;
  const out = [];

  out.push(`# ${site.name}`, '');
  out.push(`[![${site.name}](./img/social-preview.jpg)](${site.url})`, '');
  out.push(`**${site.headline}**`, '');
  for (const para of site.intro) out.push(para, '');
  out.push(
    [
      `[Portfolio site](${site.url})`,
      `[Career history](${L.career})`,
      `[Blog](${L.blog})`,
      `[Email](mailto:${site.email})`,
      `[LinkedIn](${L.linkedin})`,
    ].join(' · '),
    '',
  );
  out.push(`**Career documents:** ${site.resume.map((r) => `[${r.label} (PDF)](${r.href})`).join(' · ')}`, '');

  out.push('## Start here', '');
  for (const s of site.startHere) out.push(`- **${s.label}:** [${s.title}](${abs(s.href)}) — ${s.text}`);
  out.push('');

  out.push('## What I work with', '');
  for (const s of site.skills) out.push(`- **${s.label}:** ${s.text}`);
  out.push('');

  out.push('## Projects', '');
  out.push(`Each project has a longer case study on [the portfolio site](${site.url}/projects/).`, '');
  for (const g of groups) {
    const list = projects.filter((p) => p.group === g);
    if (!list.length) continue;
    out.push(`### ${g}`, '');
    if (groupNotes[g]) out.push(groupNotes[g], '');
    out.push('| Project image | Project |', '| :--- | :--- |');
    for (const p of list) {
      const pic = `[![${cell(p.alt)}](./img/projects/${p.slug}-sm.jpg)](${caseStudy(p)})`;
      const ls = [...links(p), ['Case study', caseStudy(p)]].map(([t, u]) => `[${cell(t)}](${u})`).join(' · ');
      const title = p.subtitle ? `${p.title} | ${p.subtitle}` : p.title;
      out.push(`| ${pic} | **${cell(title)}**<br>${cell(p.pitch)}<br>${ls} |`);
    }
    out.push('');
  }

  out.push('## Beyond code', '');
  for (const para of site.beyond) out.push(para, '');
  out.push(`[More about me](${site.url}/about/) · [Schedule a conversation](${L.calendly})`, '');

  writeFileSync(join(root, 'README.md'), out.join('\n'));
}
