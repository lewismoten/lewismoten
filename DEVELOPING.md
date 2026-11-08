# Developing lewismoten.github.io

How my portfolio site is laid out and built. `README.md` is the repository's front page on GitHub, so it reads as a profile instead; `build.mjs` writes it from the same content as the site, so don't edit it by hand.

The site: a home page, a case study for each project, and short dated project posts that link to my blog for the long write-ups. It is plain static HTML made by one small Node script, with no framework and no dependencies.

## Layout

| Path | What it holds |
| --- | --- |
| `build.mjs` | The build script. Reads the content, writes `docs/` and `README.md`. |
| `readme.mjs` | Writes `README.md` (the GitHub front page) from `site.json` and the projects. |
| `site.json` | Name, headline, intro, About text, contact links, resume links, navigation. |
| `content/projects.json` | One entry per project, in groups. |
| `content/posts/*.md` | One short post per file. |
| `img/` | Images. `img/projects/<slug>.jpg` is the project's social preview (640 x 320, the hero and the `og:image`). `<slug>-sm.jpg` is its miniature (320 x 160) for cards. |
| `static/` | CSS, the theme and filter scripts, favicon. Copied to `docs/` as is. |
| `docs/` | The built site. Committed. Never edit it by hand. |

## Build

```sh
node build.mjs
```

Needs Node 20 or newer. It rebuilds `docs/` from scratch and stops with a message if a post or project is missing a required field. To look at it locally:

```sh
npx http-server docs -p 8150
```

(or any static server that serves `docs/` as the site root).

Or open `docs/index.html` straight from the file system: the build writes every link between pages as a relative link ending in `index.html`, so it works without a server. The 404 page is the exception (GitHub serves it at any depth), so its links go to the live site.

## Add a project

Add an object to `content/projects.json`:

- `slug`, `title`, `subtitle`, `group` (one of the `groups` at the top), `featured` (true shows it on the home page), `pitch` (one sentence), `tags`, `alt` (the preview image's alt text).
- `links`: `demo`, `source`, and lists `video`, `press`, `other`, each `{ "label", "url" }`.
- Case study text: `problem`, `built`, `hard`, `results`, `role`. Keep it 120 to 250 words in all and only say what the repository or my own pages say. A missing `hard` or `results` is skipped.
- Images: the repository's social preview, saved as `img/projects/<slug>.jpg` (640 x 320, under about 150 KB) and a miniature `img/projects/<slug>-sm.jpg` (320 x 160, under about 30 KB). On macOS: `sips -s format jpeg -s formatOptions 75 -z 160 320 in.png --out img/projects/<slug>-sm.jpg`.

Text in the case-study fields can use `**bold**`, `*italic*`, `` `code` `` and `[links](https://...)`.

## Add a post

Create `content/posts/YYYY-MM-DD-short-name.md`:

```
---
title: The post title
date: 2026-11-08
project: a-project-slug
images:
  - src: /img/projects/a-project-slug.jpg | Alt text | 640 | 320
blog: https://lewismoten.com/...   (or link: and linklabel: for another page)
---
A short paragraph or two.
```

Every image line is `path | alt text | width | height`, with an optional fifth part `pixel` for pixel art. Put screenshots in `img/posts/`. Posts are sorted newest first, appear in the feed at `/feed.xml`, and each gets its own page. Always give the post a date.

## Publish

The site is served from the `docs/` folder of the `main` branch (Settings, Pages, Deploy from a branch, `main`, `/docs`). There is no GitHub Action; I build on my Mac and commit `docs/`.

```sh
node build.mjs
git add -A
git commit -m "Update site"
git push
```

## Checks I ran

Axe (WCAG 2.2 AA and best practices) at 1440 and 390 pixels wide, in light and dark, with Playwright's bundled Chromium, plus a check that no page scrolls sideways at 390 pixels.

## Credits

Project previews are each repository's own social preview. How each preview was made is noted in its own repository. The build script, styles, and first draft of the case studies were written with Claude (Claude Sonnet 5.5, Anthropic) from my repositories and pages.
