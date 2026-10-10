# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Astro 6 static site for Leonardo's personal page. Light, one-column,
text-first "research / job card" design. **Zero JavaScript**: no islands,
no client directives; `tests/build.test.ts` fails if any built page
contains a `<script>` tag or references a webfont.

Deployed to GitHub Pages from the `gh-pages` branch by
`.github/workflows/deploy.yml` on push to `main`. Site URL:
`https://leonardofhy.github.io`.

Design spec: `docs/superpowers/specs/2026-10-11-minimal-redesign-design.md`.
Earlier states: `hugo-v6-final` (Hugo), `v6-final` (terminal UI on Astro).

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check + astro build → dist/
npm test          # vitest; build.test.ts runs astro build in beforeAll
npm run check     # type + content-schema check only
```

## Architecture

- `astro.config.mjs`: `output` static, `trailingSlash: 'always'`,
  `site: 'https://leonardofhy.github.io/'`, integrations: sitemap only.
  `redirects` maps the old `/about/`, `/resume/`, `/posts/...` paths.
- Content collections in `src/content.config.ts` (Zod via `astro/zod`):
  - `posts`: `title`, `date`, `summary` required; `tags`, `draft`,
    `featured`, `lang` ('en' | 'zh-TW') optional.
  - `projects`: adds `technologies`, `status`, `project_url`, `featured`.
- `src/lib/text.ts`: pure helpers (`formatDate`, `yearOf`,
  `readingMinutes`; all Asia/Taipei, CJK-aware). Unit-tested without Astro.
- `src/lib/posts.ts`: `getPublishedPosts()`, `getPostStats()`.
- `src/lib/site.ts`: `SITE`, `NAV`, `LINKS`, `NavKey`.
- `src/data/cv.ts`: CV arrays rendered by `src/pages/cv.astro`.
- `src/layouts/BaseLayout.astro`: `<head>`, header, `<main>`, footer.
  Props: `title`, `description` (required), `lang`, `active`.
- Components are `.astro` only: `SiteHeader`, `SiteFooter`, `PostList`,
  `ProjectEntry`, `CvEntry`.
- Routes: `/`, `/writing/`, `/writing/[slug]/`, `/projects/`,
  `/projects/[slug]/`, `/cv/`, `/404.html`, `/rss.xml`, `/index.xml`.
- Styles: `src/styles/global.css` only. Tokens on `:root`. Light only.

## Rules

- Keep zero JS. Do not add `client:*` directives, React, or scripts.
- Do not add webfonts; system font stacks only.
- Do not add dark mode.
- Never invent CV entries, employers, dates or an email. Real data comes
  from the user; `src/data/cv.ts` holds only what they supplied.
- Every internal link ends with `/`.
- Content is markdown only (`.md`); MDX is not installed.
- Astro major upgrades are a separate task; stay on 6.x unless asked.
