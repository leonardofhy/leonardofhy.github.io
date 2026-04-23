# Leonardo's Notes

Personal site for Leonardo Foo Haw Yang (胡皓雍), built with [Astro](https://astro.build) + React and hosted on GitHub Pages. Design direction: the V6 "Agent" aesthetic, modelled on the Claude Code terminal UI.

Live at **https://leonardofhy.github.io**.

Before 2026-04 this site was Hugo + PaperMod; that version is preserved at the `hugo-v6-final` git tag.

## Local development

### Prerequisites

- Node **20+** (tested on 22)
- npm (or pnpm / yarn — scripts use npm)

### First time

```bash
git clone https://github.com/leonardofhy/leonardofhy.github.io.git
cd leonardofhy.github.io
npm install
```

### Commands

```bash
npm run dev       # dev server with hot reload at http://localhost:4321
npm run build     # astro check + astro build → dist/
npm run preview   # serve dist/ for a prod-like local check
npm test          # vitest (runs a full astro build in beforeAll)
npm run check     # type + content-schema check
```

## Writing

### New blog post

Drop a markdown file into `src/content/posts/`:

```yaml
---
title: "Your Post Title"
date: 2025-01-20T14:55:00+08:00     # ISO-8601; UTC+8 is fine
draft: false
tags: ["tag1", "tag2"]
categories: ["Category"]
summary: "Brief description"          # REQUIRED — shown in list, OG, RSS
featured: false                       # optional; surfaces on the home page
lang: en                              # optional; 'en' | 'zh-TW'
---

Your content in Markdown…
```

Run `npm run check` to validate the frontmatter against the Zod schema in `src/content.config.ts` before committing.

### New project

Drop a markdown file into `src/content/projects/` with:

```yaml
---
title: "Project Name"
date: 2026-02-10
summary: "One-line description."
technologies: ["Python", "OpenAI API"]
status: shipped              # shipped | archived | private | wip
project_url: "https://..."
featured: true
---
```

### Images

Put files in `public/images/` and reference them as `/images/filename.jpg`.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`:

1. `actions/setup-node` with Node 22 + npm cache
2. `npm ci`
3. `npm run build` (runs `astro check && astro build`)
4. `peaceiris/actions-gh-pages@v4` publishes `./dist` to the `gh-pages` branch

GitHub Pages serves from `gh-pages`. Concurrency group `pages` cancels in-progress deploys so only the latest commit wins.

## Architecture at a glance

```
src/
├── components/           # .astro (zero JS) + .tsx islands
├── content/
│   ├── posts/
│   ├── projects/
│   └── pages/            # about + resume markdown
├── content.config.ts     # Zod schemas for content collections
├── layouts/
│   └── BaseLayout.astro  # <head>, lang, global CSS import
├── pages/                # file-based routes
│   ├── index.astro       # V6 Agent homepage
│   ├── posts/
│   ├── projects/
│   ├── tags/
│   ├── about.astro
│   ├── resume.astro
│   ├── rss.xml.ts
│   ├── index.xml.ts      # Hugo-compat RSS alias
│   └── 404.astro
└── styles/
    └── global.css        # V6 design tokens + all component styles
tests/
├── build.test.ts         # integration: astro build + cheerio assertions
└── content.test.ts       # source-file schema checks
```

The homepage `AgentREPL` is currently a **visual mock** — input and send button are disabled. Wiring a streaming Claude endpoint is a deliberate follow-up: flip `output: 'server'` in `astro.config.mjs` and add an adapter (Vercel or Cloudflare).

## Troubleshooting

**Build fails with a content-collection error**
Run `npm run check` — the error points at the offending frontmatter field. Common causes: missing `summary`, `date` that Zod can't coerce, an invalid `status` on a project.

**Dev server won't hot-reload a new post**
Astro picks up new files on save but sometimes a restart clears a stale cache: stop the server and run `npm run dev` again.

**Tests fail because `dist/` is missing**
`npm test` runs `astro build` in `beforeAll`. If it fails, check the preceding build output — the error is from the Astro build, not vitest.
