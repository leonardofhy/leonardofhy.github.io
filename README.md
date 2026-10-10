# leonardofhy.github.io

Personal site for Leonardo Foo Haw Yang (胡皓雍). Astro, static output,
GitHub Pages. Light, one-column, text-first design with zero JavaScript.

Live at **https://leonardofhy.github.io**.

History: Hugo + PaperMod until 2026-04 (tag `hugo-v6-final`), then a
Claude Code-style terminal UI on Astro until 2026-10 (tag `v6-final`).

## Local development

Node 22.12+ (CI uses 22).

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check + astro build → dist/
npm run preview   # serve dist/
npm test          # vitest; build.test.ts runs a full astro build first
npm run check     # type + content-schema check only
```

## Content

### Post

Drop a markdown file into `src/content/posts/`:

```yaml
---
title: "Post Title"
date: 2026-04-23T19:30:00+08:00   # ISO-8601, UTC+8 is fine
summary: "One or two sentences."   # required; list, OG, RSS
tags: ["ai", "agents"]             # optional
featured: false                    # optional
lang: en                           # optional; en | zh-TW
draft: false                       # optional
---
```

### Project

Drop a markdown file into `src/content/projects/`:

```yaml
---
title: "Project Name"
date: 2026-02-10
summary: "One line."
technologies: ["Python"]
status: shipped                    # shipped | archived | private | wip
project_url: "https://github.com/..."
featured: true                     # shows under "Selected work" on the home page
---
```

### CV

Edit the typed arrays in `src/data/cv.ts`.

### Site-wide strings

Name, description, nav and footer links live in `src/lib/site.ts`.

## Structure

```
src/
├── components/        SiteHeader, SiteFooter, PostList, ProjectEntry, CvEntry (.astro, no JS)
├── content/           posts/, projects/   (markdown)
├── content.config.ts  Zod schemas
├── data/cv.ts         CV data
├── layouts/BaseLayout.astro
├── lib/               posts.ts (collection helpers), text.ts (pure helpers), site.ts (constants)
├── pages/             index, writing/, projects/, cv, 404, rss.xml, index.xml
└── styles/global.css
tests/
├── build.test.ts      builds the site, asserts structure with cheerio
├── content.test.ts    frontmatter checks on source files
└── text.test.ts       unit tests for lib/text.ts
```

Old URLs (`/about/`, `/resume/`, `/posts/...`) redirect via `redirects`
in `astro.config.mjs`.

## Deployment

Push to `main` runs `.github/workflows/deploy.yml`: `npm ci`, `npm test`,
`npm run build`, then `peaceiris/actions-gh-pages@v4` publishes `dist/`
to the `gh-pages` branch.
