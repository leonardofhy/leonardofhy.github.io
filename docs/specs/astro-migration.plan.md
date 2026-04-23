# Plan: Astro migration execution

Spec: [`astro-migration.md`](./astro-migration.md)
Branch: `feature/astro-migration` (already created, off `main`)

## Strategy

- **One branch, one PR.** All phases land on `feature/astro-migration`. We open the PR after Phase 3a passes local tests, then iterate phases as additional commits on the same PR.
- **Each phase = one atomic commit** (sometimes 2: test commit + impl commit).
- **TDD where it fits.** The ROI of unit tests on Astro components is low; the value is in `astro check` + `astro build` passing + a small integration suite in `tests/build.test.ts` that asserts the right HTML appears.
- **Subagent usage**: delegate Phase 3c (component port from JSX) because it's isolated and mechanical. Main thread owns orchestration, commits, PR, and every phase that needs cross-file decisions.

## Phase ordering and dependencies

```
3a (scaffold + smoke)
   ↓
3b (content schema + content migration)
   ↓
3c (V6 components port) ─── can run parallel with 3b once 3a is done
   ↓
3d (home) ── depends on 3b + 3c
   ↓
3e (posts list + single) ── depends on 3b + 3c
   ↓
3f (projects list + single) ── depends on 3b + 3c
   ↓
3g (about + resume) ── depends on 3c
   ↓
3h (RSS + sitemap + 404 + tags)
   ↓
3i (GitHub Actions swap + deploy)
   ↓
3j (Hugo removal + CLAUDE.md + archive tag)
```

---

## Phase 3a — Scaffold + smoke

**Goal**: `npm run build` produces a `dist/` with a placeholder home page; `astro check` passes; TypeScript strict is on.

**TDD checklist**:
- [ ] Write `tests/build.test.ts` with one skipped test: `it.skip('build produces dist/index.html')`.
- [ ] `npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git --skip-houston` into the repo root (repo is not empty — Astro will ask; pre-answer).
- [ ] Install deps: `astro @astrojs/react @astrojs/mdx @astrojs/rss @astrojs/sitemap react react-dom vitest cheerio @types/react @types/react-dom @types/cheerio`.
- [ ] `npx astro add react mdx sitemap` to wire integrations.
- [ ] Add `trailingSlash: 'always'`, `site: 'https://leonardofhy.github.io/'` to `astro.config.mjs`.
- [ ] Port `assets/css/extended/personal-home.css` → `src/styles/global.css`, import in a `BaseLayout.astro`, have a placeholder `index.astro` that renders `<h1>hello</h1>`.
- [ ] Unskip the test, assert `dist/index.html` contains `hello`. Run vitest — green.
- [ ] Append `node_modules/`, `dist/`, `.astro/` to `.gitignore`.

**Commit**: `chore(astro): scaffold Astro 5 project and port CSS tokens`

**Blockers before next phase**: `npx astro build && npm test` must both be green.

---

## Phase 3b — Content collections + migration

**Goal**: `src/content/posts/*.md` and `src/content/projects/*.md` load through Astro Content Collections with a typed Zod schema; `astro check` passes.

**TDD checklist**:
- [ ] Write failing test in `tests/build.test.ts`: `it('loads 5 posts and 2 projects via content collections')` — will add a debug page `src/pages/__debug.astro` that `JSON.stringify(await getCollection('posts'))` and the test asserts count + titles.
- [ ] Create `src/content.config.ts` with the two Zod schemas from spec §3.1 and §3.2.
- [ ] Copy `content/posts/*.md` → `src/content/posts/*.md` verbatim.
- [ ] Copy `content/projects/*.md` → `src/content/projects/*.md` verbatim (skip `_index.md` — not needed in Astro).
- [ ] Copy `content/about/index.md` → `src/content/pages/about.md`, `content/resume/index.md` → `src/content/pages/resume.md`. (Separate `pages` collection so they can be queried if needed, but primarily rendered via `.astro` pages.)
- [ ] Run `astro check` — fix any schema violations. Most likely: the `draft` field on a post frontmatter that's `draft: false` should just parse; if a post lacks `summary`, generate one.
- [ ] Run integration test — green.
- [ ] Delete `src/pages/__debug.astro` before commit.

**Commit**: `feat(content): add posts/projects collections with Zod schemas`

---

## Phase 3c — V6 components port from JSX bundle (**subagent-delegable**)

**Goal**: The React V6 components from `~/Workspace/leonardofhy-design-bundle/leonardo-website/project/variations/{V6Home,V6SubPages}.jsx` live as a mix of `.astro` (for static chrome) and `.tsx` (for interactive islands) in `src/components/` and `src/layouts/`.

**TDD checklist**:
- [ ] Write failing component smoke test in `tests/components.test.ts`: render `<TerminalPanel title="x" />` via `@astrojs/compiler`? Too flaky. Alternative: assert presence in built HTML via the integration suite — test at Phase 3d.
- [ ] Break down V6Home.jsx:
  - `TopBar` → `src/components/TopBar.astro` (props: `active`)
  - `TerminalPanel` (rounded card, panel-top with dots + meta, status-bar) → `src/components/TerminalPanel.astro` (named slots: `title`, `meta`, `status`; default slot = body)
  - `ToolCall` chip → `src/components/ToolCall.astro`
  - `AgentREPL` (the static conversation + input row + quick chips) → `src/components/AgentREPL.tsx` — React island, but inputs disabled for v1.
  - `BelowCard` → `src/components/BelowCard.astro`
- [ ] Break down V6SubPages.jsx:
  - `StreamItem` (collapsible post entry) → `src/components/StreamItem.tsx` React island (uses `<details>` + state for tag filtering).
  - `GitLogRow` → `src/components/GitLogRow.astro`
  - `TomlBlock` → `src/components/TomlBlock.astro`
  - `ProjectCard` → `src/components/ProjectCard.astro`

**Subagent brief**: give it the path to the JSX bundle, the CSS file, the spec section 5, and these hard rules: (a) preserve the exact class names from `global.css` (no renaming), (b) `.astro` components ship zero JS unless directive given, (c) React islands use `client:visible` unless above-the-fold (`client:load`).

**Commit**: `feat(components): port V6 terminal components from design bundle`

---

## Phase 3d — Home page

**Goal**: `/` renders the V6 Agent mock at visual parity with current Hugo home.

**TDD checklist**:
- [ ] Extend `tests/build.test.ts` with home assertions (from spec §6 test plan item 3).
- [ ] `src/pages/index.astro`: imports `BaseLayout`, `TopBar`, `TerminalPanel`, `AgentREPL`, `BelowCard`. Uses `getCollection('posts')` + `getCollection('projects')` to pick latest + featured.
- [ ] Port the hard-coded "whoami" seed conversation into `AgentREPL` defaults.
- [ ] Run tests — green.
- [ ] `npm run dev` — visual spot-check on localhost (reported `UNVERIFIED` if browser unavailable).

**Commit**: `feat(home): implement V6 Agent homepage with live content collections`

---

## Phase 3e — Posts list + post detail

**Goal**: `/posts/` and `/posts/<slug>/` reach visual + URL parity.

**TDD checklist**:
- [ ] Extend tests: assertions for both pages.
- [ ] `src/pages/posts/index.astro` with `StreamItem` React islands. Filter chips use URL params (`?tag=hugo`) — static-safe, handled via client-side URL read.
- [ ] `src/pages/posts/[...slug].astro` with `getStaticPaths()` from collection. `PostLayout.astro` wraps content; `<slot />` receives MDX-rendered body.
- [ ] Prev/next nav computed by sorting collection.
- [ ] Run tests — green.

**Commit**: `feat(posts): implement tail-f list and read_file post detail`

---

## Phase 3f — Projects list + project detail

**Goal**: `/projects/` and `/projects/<slug>/` reach parity.

**TDD checklist**:
- [ ] Extend tests.
- [ ] `src/pages/projects/index.astro` with `ProjectCard` per entry. `featured` flag applies the star badge.
- [ ] `src/pages/projects/[...slug].astro` with the project manifest + body.
- [ ] Build log section hard-coded (as in Hugo) or derived from `Lastmod` — mirror current behavior.

**Commit**: `feat(projects): implement cat-projects.json list and detail`

---

## Phase 3g — About + Resume

**Goal**: `/about/` and `/resume/` reach parity.

**TDD checklist**:
- [ ] Extend tests.
- [ ] `src/pages/about.astro` — TOML blocks, portrait placeholder, connect card. Markdown body from `src/content/pages/about.md` rendered in a supplementary section.
- [ ] `src/pages/resume.astro` — git-log table, CV aside + main, skills section.

**Commit**: `feat(pages): implement TOML about page and git-log resume page`

---

## Phase 3h — RSS + sitemap + 404 + tag archives

**Goal**: Feed consumers and search engines don't notice the migration.

**TDD checklist**:
- [ ] Confirm Hugo's current feed URL: `curl -I https://leonardofhy.github.io/index.xml` locally via `hugo server`; reproduce at the same path in Astro.
- [ ] `src/pages/rss.xml.ts` using `@astrojs/rss` over the posts collection.
- [ ] `@astrojs/sitemap` integration already added in 3a; verify it builds `sitemap-index.xml`.
- [ ] `src/pages/404.astro` — V6-styled 404 (terminal panel with `$ cd /nowhere` joke, link home).
- [ ] `src/pages/tags/[tag].astro` with `getStaticPaths()` over all unique tags; renders a `StreamItem` list filtered to that tag.
- [ ] Extend tests: RSS is valid XML, sitemap exists, 404 builds, tag pages exist for every tag.

**Commit**: `feat(feed): add RSS, sitemap, 404, and tag archive pages`

---

## Phase 3i — GitHub Actions + deploy

**Goal**: Pushing to `main` builds Astro and publishes to GitHub Pages at the same URL.

**TDD checklist**:
- [ ] Read current `.github/workflows/deploy.yml` and quote its structure.
- [ ] Rewrite using Astro's official GH Pages template: `actions/checkout`, `actions/setup-node`, `npm ci`, `npx astro build`, `actions/configure-pages`, `actions/upload-pages-artifact` with `path: ./dist`, `actions/deploy-pages`.
- [ ] Preserve concurrency group + cancellation semantics from current workflow.
- [ ] Dry-run by triggering via `workflow_dispatch` on the branch (needs user to push + click run); mark `UNVERIFIED` until confirmed.

**Commit**: `ci: swap Hugo build for Astro in deploy workflow`

---

## Phase 3j — Hugo removal + CLAUDE.md + archive tag

**Goal**: Repo is Astro-only; no dead Hugo files.

**TDD checklist**:
- [ ] Before deleting: `git tag hugo-v6-final <last-hugo-commit-on-main>` and `git push origin hugo-v6-final`. This is a destructive-ish action — I will **pause for user confirmation** before pushing the tag.
- [ ] `git submodule deinit -f themes/PaperMod && git rm -f themes/PaperMod && rm -rf .git/modules/themes && rm .gitmodules`.
- [ ] `rm -rf layouts/ archetypes/ assets/ content/ static/ hugo.toml resources/`.
- [ ] Rewrite `CLAUDE.md`: Astro commands, architecture notes, content conventions, kill references to Hugo/PaperMod/Go templates.
- [ ] Verify: `npm run build && npm test` still green.

**Commit**: `chore: remove Hugo scaffolding; rewrite CLAUDE.md for Astro`

---

## Phase 4 — Atomic commits

Already enforced by the per-phase commit style above. No squash before merge.

## Phase 5 — PR + Verification Checklist

After Phase 3a lands locally:
- `gh pr create --base main --head feature/astro-migration --draft --title "Migrate site from Hugo to Astro 5 + React" --body <spec link + phases>`

After all phases green locally:
- Mark PR ready for review.
- Provide `## Verification Checklist`:
  - [x] `npm run build` clean
  - [x] `npm test` all green
  - [x] `astro check` passes
  - [ ] `UNVERIFIED`: `npm run dev` → visual parity at `localhost:4321` for `/`, `/posts/`, `/posts/<slug>/`, `/projects/`, `/projects/<slug>/`, `/about/`, `/resume/`, `/tags/hugo/`
  - [ ] `UNVERIFIED`: GitHub Actions build on `main` succeeds after merge
  - [ ] `UNVERIFIED`: `https://leonardofhy.github.io/` renders correctly post-deploy
  - [ ] `UNVERIFIED`: RSS reader (or `curl https://leonardofhy.github.io/rss.xml`) returns a valid feed
  - [ ] `UNVERIFIED`: existing inbound links (e.g. `/posts/building-hugo-blog-lessons-learned/`) still resolve

---

## Estimated effort

- Phase 3a: 45min
- Phase 3b: 30min
- Phase 3c: 90min (subagent + review)
- Phase 3d–3g: 60min each = 4h
- Phase 3h: 40min
- Phase 3i: 30min
- Phase 3j: 20min

**Total**: ~8 hours of focused work. Realistic wall-clock across an afternoon + iterative review cycles.

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Trailing-slash mismatch breaks inbound links | `trailingSlash: 'always'` + Phase 3i parity check |
| RSS shape changes, breaks subscribers | `@astrojs/rss` output is standard; users with strict readers may resubscribe |
| `astro:assets` image processing differs from Hugo's pipeline | Not a concern: no posts currently use processed images, only `static/images/*` |
| Content frontmatter Zod rejects a post | Fix the post frontmatter; do not loosen the schema |
| Claude Code hallucinates an Astro API that doesn't exist | Prefer `npx astro add` over manual config; cross-check against `docs.astro.build` when uncertain |
| `themes/PaperMod` submodule removal fails | Documented deinit sequence in Phase 3j |
| GitHub Actions fails after merge, site goes blank | `hugo-v6-final` tag + `git revert` available |

---

## STOP — Plan Review Gate

Please confirm before I touch code:

1. **Single cutover** (this branch → PR → merge → Hugo deleted) — OK?
2. **Stay on GitHub Pages**, no Vercel/Cloudflare in this PR — OK?
3. **AgentREPL as visual mock only**, no live Claude wiring — OK?
4. **CSS file ported verbatim**, no refactor — OK?
5. **Phase ordering** above, or want Phase 3c earlier / later?
6. **Subagent delegation of Phase 3c** — OK, or do it inline?
7. Any phase you want to **drop** (e.g. tag archives, 404 page)?

Once you green-light, I run Phase 3a and pause again only if I hit a spec-contradicting surprise or need to push the `hugo-v6-final` tag.
