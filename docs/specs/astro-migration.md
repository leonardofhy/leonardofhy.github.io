# Spec: Migrate leonardofhy.github.io from Hugo → Astro + React

Status: draft · Author: Leonardo + Claude Code · Branch: `feature/astro-migration`

## 1. Goal

Replace the Hugo + PaperMod stack with Astro 5 + React integration while preserving the V6 Claude Code terminal UI, all current content, and the GitHub Pages deployment, so future interactive features (live Claude REPL, command palette, MDX widgets) are a small step rather than a rewrite.

## 2. User flow

Nothing visible should change for the reader:

- `https://leonardofhy.github.io/` renders the V6 Agent mock homepage.
- `/posts/` lists posts in the `tail -f posts/` stream.
- `/posts/<slug>/` renders a post with the `read_file` chrome.
- `/projects/`, `/projects/<slug>/`, `/about/`, `/resume/` match the current V6 layouts.
- Permalinks, RSS feed URL, and sitemap URL stay the same.
- Dark-only theme stays. No theme toggle.

New capability (not a behavior change, just available):

- A React island on the homepage — the `AgentREPL` — is now a real React component. It still ships as a visual mock for v1, but wiring a streaming Claude endpoint becomes a follow-up PR, not a rewrite.
- Markdown files can become `.mdx` and import React components for future interactive widgets.

## 3. Data contract

### 3.1 Content frontmatter — posts

Source: `content/posts/building-hugo-blog-lessons-learned.md` (quoted verbatim below, all 5 posts follow the same shape):

```yaml
---
title: "Building a Hugo Blog: Lessons Learned"
date: 2025-08-05T16:30:00+08:00
draft: false
tags: ["hugo", "blogging", "web-development", "github-pages"]
categories: ["Web Development"]
author: "胡皓雍 (Leonardo Foo Haw Yang)"
summary: "My experience setting up this Hugo blog with the PaperMod theme, including challenges faced, solutions found, and tips for other developers."
---
```

**Astro posts schema (Zod)** — required vs optional explicit:

| Field | Type | Req? | Notes |
|---|---|---|---|
| `title` | `string` | **required** | |
| `date` | `z.coerce.date()` | **required** | ISO-8601 with timezone; `z.coerce.date()` handles Hugo's format |
| `draft` | `boolean` | optional, default `false` | |
| `tags` | `z.array(z.string())` | optional, default `[]` | |
| `categories` | `z.array(z.string())` | optional, default `[]` | |
| `author` | `string` | optional | falls back to `site.author` |
| `summary` | `string` | **required** | used by list page + OG + RSS |
| `featured` | `boolean` | optional, default `false` | not currently on posts but reserve the field |
| `hiddenInHomeList` | `boolean` | optional, default `false` | Hugo param, keep behavior |
| `lang` | `z.enum(['en','zh-TW'])` | optional, default `'en'` | drives `<html lang>`; existing zh-TW post is `hello-world.md` |

### 3.2 Content frontmatter — projects

Source: `content/projects/ai-blog-assistant.md`:

```yaml
---
title: "AI Blog Assistant"
date: 2026-02-10
draft: false
summary: "A lightweight assistant workflow that turns research notes into publish-ready Hugo posts with cleaner structure and metadata."
tags: ["AI", "Automation", "Hugo", "GitHub Actions"]
categories: ["Projects"]
technologies:
  - "Python"
  - "OpenAI API"
  - "Hugo"
  - "GitHub Actions"
featured: true
project_url: "https://github.com/leonardofhy"
---
```

**Astro projects schema**:

| Field | Type | Req? |
|---|---|---|
| `title` | `string` | **required** |
| `date` | `z.coerce.date()` | **required** |
| `summary` | `string` | **required** |
| `technologies` | `z.array(z.string())` | optional, default `[]` |
| `tags` | `z.array(z.string())` | optional, default `[]` |
| `categories` | `z.array(z.string())` | optional, default `[]` |
| `featured` | `boolean` | optional, default `false` |
| `status` | `z.enum(['shipped','archived','private','wip'])` | optional, default `'shipped'` |
| `project_url` | `z.string().url()` | optional |
| `draft` | `boolean` | optional, default `false` |

### 3.3 About + Resume pages

Currently `content/about/index.md` and `content/resume/index.md` with `layout: "page"`. In Astro these become `src/pages/about.astro` and `src/pages/resume.astro` (plain pages, not content collection entries), because their layouts are fully custom (TOML / git log metaphors) — the markdown body is only used for supplementary prose on Resume.

**Contract**: markdown body of `content/about/index.md` and `content/resume/index.md` is preserved and rendered inline in the new `.astro` pages. The top-of-page bio/intro is hard-coded in the component (same as today's Hugo layout).

### 3.4 `params.home` → Astro site config

Current `hugo.toml` `[params.home]` values (`brandSub`, `nowTitle`, `now`, `featuredPostCount`, `featuredProjectCount`, `contactLinks`) move to `src/config/site.ts` as a typed constant. No runtime YAML/TOML parsing needed.

### 3.5 URL contract (must not break)

| Page | URL | Source in Astro |
|---|---|---|
| Home | `/` | `src/pages/index.astro` |
| Posts list | `/posts/` | `src/pages/posts/index.astro` |
| Post | `/posts/<slug>/` | `src/pages/posts/[...slug].astro` |
| Projects list | `/projects/` | `src/pages/projects/index.astro` |
| Project | `/projects/<slug>/` | `src/pages/projects/[...slug].astro` |
| About | `/about/` | `src/pages/about.astro` |
| Resume | `/resume/` | `src/pages/resume.astro` |
| RSS | `/index.xml` OR `/rss.xml` | `src/pages/rss.xml.ts` — match whichever Hugo emits today |
| Sitemap | `/sitemap.xml` | `@astrojs/sitemap` |
| Tag pages | `/tags/<tag>/` | `src/pages/tags/[tag].astro` (Hugo auto-generates these; reproduce) |

Set `trailingSlash: 'always'` in `astro.config.mjs` because Hugo emits trailing slashes and existing inbound links likely use them.

### 3.6 Assets

- `static/images/*` → `public/images/*` (same URL path).
- `assets/css/extended/personal-home.css` → `src/styles/global.css` (tokens verbatim).

## 4. Non-goals

- **Live Claude REPL.** Homepage REPL stays a visual mock; no server endpoint, no API key wiring. That is a follow-up PR once the static site is at parity.
- **Deploy target change.** We stay on GitHub Pages. No Vercel/Cloudflare adapter in this PR.
- **Tailwind / new design system.** Keep existing CSS tokens as-is; only port, do not refactor.
- **i18n routing.** No `/en/` + `/zh-TW/` split. `lang` frontmatter drives `<html lang>` only.
- **Command palette, search, OG image generation.** Deferred.
- **Theme toggle / light mode.** Stays dark-only (project memory: this is intentional).
- **Content rewrites.** Markdown bodies are copied unchanged. Only frontmatter tweaks if needed to satisfy Zod.

## 5. Affected modules

**Create**:
- `package.json`, `package-lock.json`
- `astro.config.mjs`
- `tsconfig.json`
- `src/content.config.ts` — Zod schemas for `posts`, `projects`
- `src/config/site.ts` — ported `params.home` values
- `src/styles/global.css` — ported from `assets/css/extended/personal-home.css`
- `src/layouts/BaseLayout.astro` — head, font link, CSS import, lang attr
- `src/layouts/PostLayout.astro` — `read_file` chrome around `<slot />`
- `src/components/TopBar.astro` — V6 top bar
- `src/components/TerminalPanel.astro` — reusable `.v6-panel` shell (slots for title/meta/body)
- `src/components/ToolCall.astro` — tool-call chip
- `src/components/BelowCard.astro` — home highlight cards
- `src/components/AgentREPL.tsx` — React island (home mock chat; disabled inputs for v1)
- `src/components/StreamItem.tsx` — collapsible post entry on posts list (React for `<details>` ergonomics)
- `src/pages/index.astro` — home
- `src/pages/posts/index.astro` — posts list
- `src/pages/posts/[...slug].astro` — post detail
- `src/pages/projects/index.astro` — projects list
- `src/pages/projects/[...slug].astro` — project detail
- `src/pages/about.astro` — about
- `src/pages/resume.astro` — resume
- `src/pages/tags/[tag].astro` — tag archive
- `src/pages/rss.xml.ts` — RSS feed
- `src/pages/404.astro` — 404
- `src/content/posts/*.md` — migrated from `content/posts/*.md`
- `src/content/projects/*.md` — migrated from `content/projects/*.md`
- `public/images/*` — migrated from `static/images/*`
- `.github/workflows/deploy.yml` — rewritten for Astro build
- `.gitignore` — append `node_modules/`, `dist/`, `.astro/`
- `tests/build.test.ts` — integration test: `astro build` + assertions on `dist/` HTML

**Delete** (at end, once parity verified):
- `layouts/` (all Go templates)
- `themes/PaperMod/` (submodule)
- `.gitmodules`
- `archetypes/`
- `assets/`
- `hugo.toml`
- `content/` (after migrating into `src/content/`)
- `static/` (after migrating into `public/`)

**Modify**:
- `CLAUDE.md` — replace Hugo instructions with Astro instructions; update commands, architecture notes, content conventions

**Archive before delete**: Tag `hugo-v6-final` on `main@233f5c3` before merging migration PR, so Hugo version is recoverable.

## 6. Testing strategy

**Level**: integration-heavy. Astro apps are mostly declarative content; unit tests on components are low ROI. The value is asserting that `astro build` produces pages with the right structure.

**Tooling**: `vitest` + `cheerio` for parsing `dist/*.html`.

**Test fixtures**: the migrated content itself (5 posts, 2 projects, about, resume) — no synthetic fixtures.

**Mocks**: none. No network, no DB.

**Test plan** (`tests/build.test.ts`):

1. `astro check` passes (TS + content-collections schema validation).
2. `astro build` completes without warnings.
3. `dist/index.html` contains V6 topbar + welcome card + 3 below-cards.
4. `dist/posts/index.html` renders a `<details>` block per source post.
5. Each `dist/posts/<slug>/index.html` contains frontmatter card + post body + prev/next nav.
6. `dist/projects/index.html` renders a card per source project; featured flag applies when `featured: true`.
7. `dist/about/index.html` contains the four TOML blocks (`identity`, `what_i_do`, `off_the_clock`, `availability`).
8. `dist/resume/index.html` contains the git-log rows.
9. `dist/rss.xml` validates as RSS 2.0 and lists all posts.
10. `dist/sitemap-index.xml` exists.

**Parity check** (manual, before merge): `diff <(find dist -name '*.html' | sort) <(find /hugo-dist -name '*.html' | sort)` on the set of URLs — should match modulo the new `tags/` pages.

**Visual smoke** (manual): `npm run dev` → open each URL in browser, confirm it looks like the current prod site. This is `UNVERIFIED` at PR time.

## 7. Open questions for review gate

Flagging these so the user can redirect **before** I code:

- **Q1**: Keep Hugo in parallel for one release cycle, or cut over in a single merge? Recommend **single cutover** — branch-based, with `hugo-v6-final` tag as rollback. Dual-maintenance is expensive.
- **Q2**: Use `@astrojs/rss` or hand-roll to match Hugo's exact XML? Recommend `@astrojs/rss` — the feed consumers won't notice differences in element ordering.
- **Q3**: React inside `.astro` files for Terminal/TopBar, OR keep those as `.astro` and only use React for genuinely interactive islands (AgentREPL, StreamItem)? Recommend **the latter** — .astro components ship zero JS by default, which is better for Lighthouse and keeps the mental model clean.
- **Q4**: CSS file — port verbatim into `src/styles/global.css`, or split into per-component stylesheets (Astro scoped styles)? Recommend **verbatim global.css for this PR**; split in a follow-up if desired.
- **Q5**: Should the React `AgentREPL` include a live Claude fetch hook that's just disabled? Recommend **no** — keep it pure UI for this PR; wire the endpoint in a separate PR on a feature branch that adds an SSR adapter.
