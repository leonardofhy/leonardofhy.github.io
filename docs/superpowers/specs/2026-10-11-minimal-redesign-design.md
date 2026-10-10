# Minimal text-first redesign — design spec

Date: 2026-10-11
Status: approved in conversation, awaiting written review

## 1. Purpose

Turn the site into a research / job "calling card": the page a PhD
committee, an internship recruiter, or a potential collaborator opens
first. Writing stays on the site but is secondary.

Non-goals: dark mode, interactive islands, a streaming Claude endpoint,
the Astro 7 major upgrade (separate task), preserving the V6 terminal
aesthetic in any form.

## 2. Visual system

- **Layout.** One centred column, `max-width: 42rem`. 16px side gutter
  on phones. No sidebars, cards, shadows, or bordered panels. Sections
  are separated by whitespace and a small heading.
- **Type.** System fonts only, no webfont requests.
  - Body: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "PingFang TC", "Noto Sans TC", sans-serif`
  - Code: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
  - Body 17px / line-height 1.6. Posts with `lang: zh-TW` get
    line-height 1.75.
- **Colour.** Light only. White background, near-black text, grey for
  dates and meta, one low-saturation link colour with underline.
  Tokens live on `:root` in `src/styles/global.css`.
- **Navigation.** Header: name (links to `/`) left, `writing · projects
  · cv` right. Footer: github, linkedin, rss. Email is added once the
  user supplies it.
- **JavaScript.** Zero. No islands. The built HTML contains no
  `<script>` tags (enforced by test).

## 3. Pages

| Route | Content |
|---|---|
| `/` | Name + one-line identity (research area, affiliation, city). 2–3 sentence intro. "Selected work": up to 3 `featured` projects. "Writing": 3 most recent posts. "Contact": link row. |
| `/writing/` | All non-draft posts grouped by year, one line each: date + title. |
| `/writing/[slug]/` | Title, date, reading time, body. No prev/next, no tags page. |
| `/projects/` | One block per project: title (external link if `project_url`), summary, technologies, status. |
| `/projects/[slug]/` | Title, meta, body. Kept for future long-form projects. |
| `/cv/` | Education, Experience, Skills. Each entry: when · institution · role · 1–2 notes. Data from `src/data/cv.ts`. |
| `/404.html` | Plain "not found" + link home. |

Empty-collection behaviour: when `projects` has zero entries, the home
"Selected work" section and `/projects/` render a single line
"coming soon" and the build must not fail.

Removed routes: `/about/`, `/resume/`, `/posts/`, `/posts/[slug]/`,
`/tags/[tag]/`.

## 4. Data and content

### Collections (`src/content.config.ts`)

`posts` schema (reduced to fields actually rendered):

| field | required | type |
|---|---|---|
| `title` | yes | string |
| `date` | yes | coerced Date |
| `summary` | yes | string |
| `tags` | no | string[] |
| `draft` | no | boolean, default false |
| `featured` | no | boolean, default false |
| `lang` | no | `'en' \| 'zh-TW'`, default `'en'` |

Removed from schema: `categories`, `author`, `hiddenInHomeList`.

`projects` schema: unchanged (`technologies`, `status`, `project_url`,
`featured` on top of the base fields).

### Content changes

Delete:
- `src/content/posts/hello-world.md`
- `src/content/posts/getting-started-with-machine-learning.md`
- `src/content/posts/python-virtual-environments-quick-guide.md`
- `src/content/posts/top-programming-tools-workflow.md`
- `src/content/posts/building-hugo-blog-lessons-learned.md`
- `src/content/projects/ai-blog-assistant.md`
- `src/content/projects/edge-deployment-monitor.md`

Keep and strip `categories` / `author` from frontmatter:
- `src/content/posts/rebuilding-my-site-as-an-agent.md`
- `src/content/posts/little-leo-workspace-to-system.md` (currently
  untracked; add to git)

### CV data (`src/data/cv.ts`)

Typed literal exporting `education`, `experience`, `skills`. Seed only
with facts already consistent across the current live site:

- B.S. Electrical Engineering, National Taiwan University, Sep 2019 –
  Jun 2023
- M.S. Communication Engineering, National Taiwan University, Sep 2023 –
  present
- Organizer, NTUAIS (NTU AI Safety), 2024 – present
- Skills: carried over verbatim from the current `resume.astro` list
  (languages / ai-ml / web / tools); the user prunes it.

Dropped as placeholder: the "Tech Company Inc." internship, the fake
commit hashes, `leonardo@…` / `leonardo@example.com`.

## 5. Routing, redirects, feeds

`astro.config.mjs` `redirects`:

```js
redirects: {
  '/about/': '/',
  '/resume/': '/cv/',
  '/posts/': '/writing/',
  '/posts/[...slug]/': '/writing/[...slug]/',
}
```

Static output emits meta-refresh pages for these. `/tags/*` becomes 404.

Feeds: `/rss.xml` kept, item links point at `/writing/<slug>/`.
`/index.xml` Hugo-compat alias kept. Sitemap via `@astrojs/sitemap`.

## 6. Components

Delete: `AgentREPL.tsx`, `StreamItem.tsx`, `TopBar.astro`,
`TerminalPanel.astro`, `ToolCall.astro`, `BelowCard.astro`,
`TomlBlock.astro`, `ProjectCard.astro`, `GitLogRow.astro`.

New (all `.astro`, zero JS):
- `SiteHeader.astro` — name + nav, takes `active`.
- `SiteFooter.astro` — link row.
- `PostList.astro` — year-grouped list, takes posts array.
- `ProjectEntry.astro` — one project block.
- `CvEntry.astro` — one CV row.

`BaseLayout.astro` keeps `<head>` responsibilities (title, description,
OG image, canonical, RSS link, lang) and imports `global.css`.
`src/lib/posts.ts` keeps `getPublishedPosts`, `getPostStats`,
`formatDate`; `getHomePosts` is removed with `hiddenInHomeList`.

## 7. Testing

`tests/build.test.ts` (runs `astro build` in `beforeAll`, asserts with
cheerio):
- header has exactly the three nav links with trailing slashes
- `/` has the four sections (intro, selected work, writing, contact)
- `/writing/` groups by year; count equals non-draft source files
- every post page has `<h1>` and a `<time>` element
- `/cv/` renders the seeded education entries
- redirect pages exist at `/about/`, `/resume/`, `/posts/` and point at
  the new paths
- `/rss.xml` has one `<item>` per published post with `/writing/` links
- **no `<script>` tag in any built HTML file**

`tests/content.test.ts`:
- every post file parses against the new schema
- no post file contains `categories:` or `author:`

CI workflow unchanged (already runs `npm test` then `npm run build`).

## 8. Cleanup

- `package.json`: remove `react`, `react-dom`, `@types/react`,
  `@types/react-dom`, `@astrojs/react`, `@astrojs/mdx`. Run
  `npm audit fix` and minor bumps; stay on Astro 6.x.
- `tsconfig.json`: remove `jsx` / `jsxImportSource`; drop Hugo-era
  `exclude` entries (`themes`, `layouts`, `assets`, `resources`,
  `content`).
- `README.md`, `CLAUDE.md`: rewrite for the new structure; remove the
  non-existent `src/content/pages/` reference.
- `docs/specs/astro-migration*.md`: keep as history.

## 9. Content the user must supply (not rendered as TODO on the site)

- Contact email
- Current M.S. status / graduation date, or current position
- Real experience entries (internships, research roles)
- Selected projects as `src/content/projects/*.md` files
- Publications, if any (would become a `/cv/` section)

Until supplied, the corresponding sections render only what §4 seeds.
