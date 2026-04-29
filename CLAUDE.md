# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Astro 6 static site running the V6 "Agent" (Claude Code terminal) design for Leonardo's personal page. Deployed to GitHub Pages from the `gh-pages` branch via a GitHub Actions workflow on push to `main`. Site URL: `https://leonardofhy.github.io`.

Migrated from Hugo + PaperMod in 2026-04 — the final Hugo state is tagged `hugo-v6-final` if you ever need to diff against it.

## Commands

```bash
npm install       # first time / after pulling new deps
npm run dev       # dev server with hot reload at http://localhost:4321
npm run build     # astro check + astro build → dist/
npm run preview   # serve dist/ for a quick prod-like local check
npm test          # vitest (also runs a full astro build as beforeAll)
npm run check     # type + content-schema check only
```

## Architecture

- **Framework**: Astro 6, `output: 'static'` (default), `trailingSlash: 'always'` in `astro.config.mjs`. Integrations: `@astrojs/react` (for interactive islands), `@astrojs/mdx`, `@astrojs/sitemap`. RSS via `@astrojs/rss`.
- **TypeScript**: `tsconfig.json` extends `astro/tsconfigs/strict`; React 19 JSX. Only `src/` and `tests/` are included.
- **Content**: typed via `src/content.config.ts` using Zod (v4, imported as `astro/zod`). Two collections:
  - `posts` — `src/content/posts/*.md` (frontmatter: `title`, `date`, `summary` required; `tags`, `categories`, `author`, `featured`, `hiddenInHomeList`, `lang`, `draft` optional)
  - `projects` — `src/content/projects/*.md` (adds `technologies`, `status`, `project_url`, `featured`)
  - `about.astro` and `resume.astro` are prose-as-code (data tables literal in the `.astro` file).
- **Shared post helpers** in `src/lib/posts.ts`: `getPublishedPosts()` (draft-filtered), `getHomePosts()` (also drops `hiddenInHomeList`), `getPostStats(post)` (body, words, lines, readMin, dateStr, fileName, frontmatterText), `formatDate` / `formatTime` (Asia/Taipei).
- **Styling**: single `src/styles/global.css` imported by `src/layouts/BaseLayout.astro`. All V6 class names (`.v6-panel`, `.v6-topbar`, `.v6-stream-item`, …) live here.
- **Components** (`src/components/`): split by JS cost
  - `.astro` (zero JS): `TopBar`, `TerminalPanel`, `ToolCall`, `BelowCard`, `TomlBlock`, `ProjectCard`, `GitLogRow`
  - `.tsx` React islands: `AgentREPL` (homepage mock chat — visual only in v1), `StreamItem` (collapsible post entry)
  - Islands are mounted with `client:load` when above-the-fold (home REPL) and `client:visible` elsewhere.
- **Routing**: file-based in `src/pages/`
  - `index.astro` → `/`
  - `posts/index.astro` → `/posts/`; `posts/[...slug].astro` → `/posts/<slug>/`
  - `projects/index.astro` → `/projects/`; `projects/[...slug].astro` → `/projects/<slug>/`
  - `about.astro` → `/about/`, `resume.astro` → `/resume/`
  - `tags/[tag].astro` → `/tags/<tag>/` (generated per unique frontmatter tag)
  - `rss.xml.ts` → `/rss.xml` (canonical feed); `index.xml.ts` → `/index.xml` (Hugo-compat alias)
  - `404.astro` → `/404.html`
- **Sitemap**: `@astrojs/sitemap` emits `/sitemap-index.xml` automatically.
- **Tests** (`tests/`): vitest + cheerio. `build.test.ts` runs `astro build` in `beforeAll`, then asserts structural properties of the built HTML (topbar, panel, welcome card, stream items, feeds, tag pages). `content.test.ts` validates source frontmatter at the file level.
- **Deployment**: Push to `main` triggers `.github/workflows/deploy.yml`. Node 22 → `npm ci` → `npm run build` → `peaceiris/actions-gh-pages@v4` publishes `./dist` to the `gh-pages` branch. Concurrency group `pages`, cancel in-progress.

## Content Conventions

Posts use YAML frontmatter:

```yaml
---
title: "Post Title"
date: 2025-01-20T14:55:00+08:00   # ISO-8601; UTC+8 is fine
draft: false                      # optional, default false
tags: ["tag1", "tag2"]            # optional
categories: ["Category"]          # optional
author: "Leonardo Foo Haw Yang"   # optional; falls back to site author
summary: "Brief description"      # REQUIRED — used by list, OG, RSS
featured: true                    # optional; surfaces on the home page
lang: en                          # optional; 'en' | 'zh-TW'
---
```

Projects use the same base plus:

```yaml
technologies: ["Python", "OpenAI API"]   # optional
status: shipped                          # shipped | archived | private | wip
project_url: "https://github.com/..."    # optional
featured: true                           # optional
```

## Key constraints

- `site` in `astro.config.mjs` is `https://leonardofhy.github.io/` (root path, no subpath). Don't commit a different site URL.
- `trailingSlash: 'always'` — every internal link should include the trailing slash (the Content Collections API-generated URLs already do).
- `contactLinks` on the About page still uses a placeholder email (`leonardo@example.com`); swap before launch if desired.
- The homepage `AgentREPL` is a **visual mock** — input and send button are disabled. Wiring a streaming Claude endpoint requires flipping `output: 'server'` (or `'hybrid'`) and adding an adapter (Vercel / Cloudflare). That is a deliberate follow-up, not a regression.
