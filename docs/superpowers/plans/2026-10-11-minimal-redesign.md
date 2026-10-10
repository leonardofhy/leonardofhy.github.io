# 極簡純文字重新設計 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 V6 終端機風格的 Astro 站改成淺色、單欄、零 JS 的研究／求職名片站，四個路由：`/`、`/writing/`、`/projects/`、`/cv/`。

**Architecture:** 保留 Astro 6 靜態輸出、content collections、RSS、sitemap 與 vitest + cheerio 的建置測試骨架。先寫新測試（紅），再一次拆掉所有 V6 頁面、元件與 React 依賴，然後逐頁重建：layout 與首頁、writing、projects、cv、redirects，最後更新文件並開 PR。

**Tech Stack:** Astro 6.x（static）、`@astrojs/rss`、`@astrojs/sitemap`、TypeScript、vitest 4、cheerio。

**Spec:** `docs/superpowers/specs/2026-10-11-minimal-redesign-design.md`

## Global Constraints

- 維持 Astro 6.x；不升 Astro 7（spec §1、§8）。
- 建置出的所有 HTML 不得含任何 `<script>` 標籤（spec §2）。
- 只用系統字型，不得有任何 `fonts.googleapis.com` 或其他 webfont 請求（spec §2）。
- 只有淺色模式；不寫 `prefers-color-scheme`（spec §2）。
- 單欄 `max-width: 42rem`，手機 16px 邊距（spec §2）。
- 所有站內連結帶尾斜線（`astro.config.mjs` 的 `trailingSlash: 'always'`）。
- `site` 維持 `https://leonardofhy.github.io/`。
- 不得編造任何 CV 條目、email、經歷；只放 spec §4 列出的事實（spec §4、§9）。
- 所有工作在分支 `redesign/minimal` 上；不直接 push `main`（push `main` 會觸發部署）。
- Commit 用 HEREDOC，只 `git add` 指定檔案，結尾加：
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ`

## Review Focus

1. **跨時區的年份分組。** 一篇 `2026-01-01T00:30:00+08:00` 的文章在 UTC 的 CI 上跑 `getFullYear()` 會得到 2025。使用者預期按台北時間分到 2026。→ Task 2 的 `yearOf` 測試。
2. **中文文章的閱讀時間。** 用空白切字會把 2,900 字的中文文算成 2 分鐘。使用者預期按字數算（約 7 分鐘）。→ Task 2 的 `readingMinutes` 測試。
3. **projects 集合為空。** 刪掉兩個假 project 後集合是空的。建置不得失敗，首頁與 `/projects/` 顯示「coming soon」。→ Task 3、Task 5 的測試。
4. **draft 文章。** `draft: true` 的文章不得出現在列表、feed，也不得產生頁面。→ Task 4 的測試（對所有來源 draft 檔斷言 dist 無對應目錄）。
5. **每頁都要有 `<title>` 與 `<meta name="description">`。** 求職名片站的連結預覽靠這兩個；漏掉任何一頁，分享出去就是空白卡。→ Task 3 的測試（走訪所有非 redirect 的 HTML）。

---

### Task 1: 開分支，寫新測試套件（紅）

**Files:**
- Modify: `tests/build.test.ts`（整檔取代）
- Modify: `tests/content.test.ts`（整檔取代）
- Create: `tests/text.test.ts`

**Interfaces:**
- Produces: 測試依賴的 DOM 合約，後面每個 task 都要符合：
  - 頁首 `header.site-header` 內有 `a.name[href="/"]` 與 `nav a` × 3（`/writing/`、`/projects/`、`/cv/`），作用中的連結帶 `aria-current="page"`。
  - 頁尾 `footer.site-footer` 內有 `a` 連到 `https://github.com/leonardofhy`、`https://www.linkedin.com/in/leonardo-fhy/`、`/rss.xml`。
  - 首頁四個 `section`，id 為 `intro`、`selected-work`、`writing`、`contact`。
  - 文章清單是 `section.year > h2 + ul.post-list > li > time[datetime] + a`。
  - 文章頁是 `article > header > h1` 與 `article time[datetime]`。
  - project 區塊是 `section.project`。
  - CV 頁三個 `section`，id 為 `education`、`experience`、`skills`；條目是 `.cv-entry`；skills 用 `dl.skills > dt`。
  - 純函式 `readingMinutes(body)`、`formatDate(d)`、`yearOf(d)` 從 `src/lib/text.ts` 匯出。

- [ ] **Step 1: 開分支**

```bash
git checkout -b redesign/minimal
```

- [ ] **Step 2: 寫 `tests/text.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readingMinutes, formatDate, yearOf } from '../src/lib/text';

describe('readingMinutes', () => {
  it('never returns less than 1', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('three short words')).toBe(1);
  });

  it('counts latin words at 220 wpm', () => {
    const body = Array(660).fill('word').join(' ');
    expect(readingMinutes(body)).toBe(3);
  });

  it('counts CJK characters at 400 cpm instead of whitespace-splitting', () => {
    const body = '中'.repeat(2000);
    expect(readingMinutes(body)).toBe(5);
  });

  it('adds mixed latin and CJK', () => {
    const body = '中'.repeat(800) + ' ' + Array(440).fill('word').join(' ');
    expect(readingMinutes(body)).toBe(4);
  });
});

describe('formatDate / yearOf', () => {
  it('formats in Asia/Taipei as YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-04-23T19:30:00+08:00'))).toBe('2026-04-23');
  });

  it('groups a post published just after midnight Taipei under the Taipei year', () => {
    expect(yearOf(new Date('2026-01-01T00:30:00+08:00'))).toBe('2026');
  });
});
```

- [ ] **Step 3: 取代 `tests/content.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const POSTS = 'src/content/posts';
const PROJECTS = 'src/content/projects';

function listMd(dir: string) {
  return readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
}

function frontmatterBlock(path: string): string {
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`No frontmatter in ${path}`);
  return match[1];
}

function readFrontmatter(path: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const line of frontmatterBlock(path).split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) obj[m[1]] = m[2].trim();
  }
  return obj;
}

describe('posts', () => {
  it('has at least one post', () => {
    expect(listMd(POSTS).length).toBeGreaterThan(0);
  });

  it('every post has title, date, summary', () => {
    for (const f of listMd(POSTS)) {
      const fm = readFrontmatter(join(POSTS, f));
      expect(fm.title, `${f} missing title`).toBeTruthy();
      expect(fm.date, `${f} missing date`).toBeTruthy();
      expect(fm.summary, `${f} missing summary`).toBeTruthy();
    }
  });

  it('no post uses removed fields (categories, author, hiddenInHomeList)', () => {
    for (const f of listMd(POSTS)) {
      const block = frontmatterBlock(join(POSTS, f));
      expect(block, `${f} has categories`).not.toMatch(/^categories:/m);
      expect(block, `${f} has author`).not.toMatch(/^author:/m);
      expect(block, `${f} has hiddenInHomeList`).not.toMatch(/^hiddenInHomeList:/m);
    }
  });

  it('lang, when present, is en or zh-TW', () => {
    for (const f of listMd(POSTS)) {
      const fm = readFrontmatter(join(POSTS, f));
      if (fm.lang) expect(['en', 'zh-TW'], `${f} lang`).toContain(fm.lang);
    }
  });
});

describe('projects', () => {
  it('every project (if any) has title, date, summary', () => {
    for (const f of listMd(PROJECTS)) {
      const fm = readFrontmatter(join(PROJECTS, f));
      expect(fm.title, `${f} missing title`).toBeTruthy();
      expect(fm.date, `${f} missing date`).toBeTruthy();
      expect(fm.summary, `${f} missing summary`).toBeTruthy();
    }
  });
});
```

- [ ] **Step 4: 取代 `tests/build.test.ts`**

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';

beforeAll(() => {
  execSync('npx astro build --silent', { stdio: 'pipe' });
}, 120_000);

const $ = (path: string) => cheerio.load(readFileSync(path, 'utf8'));

function sourceSlugs(dir: string, { drafts }: { drafts: boolean }): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .filter((f) => {
      const text = readFileSync(join(dir, f), 'utf8');
      const fm = text.match(/^---\n([\s\S]*?)\n---/);
      const isDraft = /^draft:\s*true\b/m.test(fm ? fm[1] : '');
      return drafts ? isDraft : !isDraft;
    })
    .map((f) => f.replace(/\.mdx?$/, ''));
}

function walkHtml(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkHtml(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const isRedirectPage = (path: string) =>
  $(path)('meta[http-equiv="refresh"]').length > 0;

const GITHUB = 'https://github.com/leonardofhy';
const LINKEDIN = 'https://www.linkedin.com/in/leonardo-fhy/';

describe('build', () => {
  it('produces dist/index.html', () => {
    expect(existsSync('dist/index.html')).toBe(true);
  });

  it('ships no JavaScript on any page', () => {
    for (const f of walkHtml('dist')) {
      expect($(f)('script').length, `${f} contains <script>`).toBe(0);
    }
  });

  it('loads no webfonts', () => {
    for (const f of walkHtml('dist')) {
      const html = readFileSync(f, 'utf8');
      expect(html, `${f} references a webfont`).not.toMatch(/fonts\.googleapis|fonts\.gstatic|@font-face/);
    }
    if (existsSync('dist/_astro')) {
      for (const n of readdirSync('dist/_astro').filter((n) => n.endsWith('.css'))) {
        expect(readFileSync(join('dist/_astro', n), 'utf8')).not.toMatch(/fonts\.googleapis|@font-face/);
      }
    }
  });

  it('every non-redirect page has a title and description', () => {
    for (const f of walkHtml('dist')) {
      if (isRedirectPage(f)) continue;
      const doc = $(f);
      expect(doc('title').text().trim(), `${f} title`).not.toBe('');
      expect(doc('meta[name="description"]').attr('content'), `${f} description`).toBeTruthy();
    }
  });
});

describe('site chrome', () => {
  it('header has the name link and three nav links with trailing slashes', () => {
    const doc = $('dist/index.html');
    expect(doc('header.site-header a.name').attr('href')).toBe('/');
    const hrefs = doc('header.site-header nav a').toArray().map((a) => doc(a).attr('href'));
    expect(hrefs).toEqual(['/writing/', '/projects/', '/cv/']);
  });

  it('marks the active nav link with aria-current', () => {
    expect($('dist/writing/index.html')('header.site-header nav a[aria-current="page"]').text()).toBe('writing');
    expect($('dist/projects/index.html')('header.site-header nav a[aria-current="page"]').text()).toBe('projects');
    expect($('dist/cv/index.html')('header.site-header nav a[aria-current="page"]').text()).toBe('cv');
    expect($('dist/index.html')('header.site-header nav a[aria-current="page"]').length).toBe(0);
  });

  it('footer links to github, linkedin and rss', () => {
    const doc = $('dist/index.html');
    const hrefs = doc('footer.site-footer a').toArray().map((a) => doc(a).attr('href'));
    expect(hrefs).toEqual([GITHUB, LINKEDIN, '/rss.xml']);
  });
});

describe('home', () => {
  it('renders the four sections in order', () => {
    const doc = $('dist/index.html');
    const ids = doc('main > section').toArray().map((s) => doc(s).attr('id'));
    expect(ids).toEqual(['intro', 'selected-work', 'writing', 'contact']);
  });

  it('intro has the full name in h1', () => {
    expect($('dist/index.html')('section#intro h1').text()).toContain('Leonardo Foo Haw Yang');
  });

  it('writing section lists one to three posts', () => {
    const n = $('dist/index.html')('section#writing ul.post-list li').length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(3);
  });

  it('selected work shows featured projects or "coming soon"', () => {
    const doc = $('dist/index.html');
    const featured = sourceSlugs('src/content/projects', { drafts: false }).filter((s) =>
      /^featured:\s*true\b/m.test(readFileSync(`src/content/projects/${s}.md`, 'utf8')),
    );
    if (featured.length === 0) {
      expect(doc('section#selected-work').text()).toContain('coming soon');
    } else {
      expect(doc('section#selected-work li').length).toBe(Math.min(3, featured.length));
    }
  });

  it('contact section links github and linkedin', () => {
    const doc = $('dist/index.html');
    const hrefs = doc('section#contact a').toArray().map((a) => doc(a).attr('href'));
    expect(hrefs).toContain(GITHUB);
    expect(hrefs).toContain(LINKEDIN);
  });
});

describe('writing', () => {
  const slugs = sourceSlugs('src/content/posts', { drafts: false });

  it('lists every published post, grouped by year', () => {
    const doc = $('dist/writing/index.html');
    expect(doc('section.year h2').length).toBeGreaterThan(0);
    expect(doc('ul.post-list li').length).toBe(slugs.length);
    for (const s of slugs) expect(doc(`a[href="/writing/${s}/"]`).length, s).toBe(1);
  });

  it('every post page has h1, time and body paragraphs', () => {
    for (const s of slugs) {
      const doc = $(`dist/writing/${s}/index.html`);
      expect(doc('article header h1').length, `${s} h1`).toBe(1);
      expect(doc('article time[datetime]').length, `${s} time`).toBe(1);
      expect(doc('article p').length, `${s} body`).toBeGreaterThan(1);
    }
  });

  it('zh-TW post sets html lang', () => {
    expect($('dist/writing/little-leo-workspace-to-system/index.html')('html').attr('lang')).toBe('zh-Hant-TW');
  });

  it('draft posts get no page', () => {
    for (const s of sourceSlugs('src/content/posts', { drafts: true })) {
      expect(existsSync(`dist/writing/${s}`), s).toBe(false);
    }
  });
});

describe('projects', () => {
  const slugs = sourceSlugs('src/content/projects', { drafts: false });

  it('lists every project or says coming soon', () => {
    const doc = $('dist/projects/index.html');
    if (slugs.length === 0) {
      expect(doc('main').text()).toContain('coming soon');
    } else {
      expect(doc('section.project').length).toBe(slugs.length);
    }
  });

  it('renders a detail page per project', () => {
    for (const s of slugs) {
      const doc = $(`dist/projects/${s}/index.html`);
      expect(doc('article header h1').length, s).toBe(1);
    }
  });
});

describe('cv', () => {
  it('renders education, experience and skills', () => {
    const doc = $('dist/cv/index.html');
    expect(doc('section#education .cv-entry').length).toBe(2);
    expect(doc('section#experience .cv-entry').length).toBeGreaterThan(0);
    expect(doc('section#skills dl.skills dt').length).toBe(4);
  });

  it('contains no placeholder employer or email', () => {
    const text = $('dist/cv/index.html')('body').text();
    expect(text).not.toContain('Tech Company');
    expect(text).not.toContain('example.com');
    expect(text).not.toContain('leonardo@');
  });
});

describe('redirects', () => {
  const refresh = (file: string) => $(file)('meta[http-equiv="refresh"]').attr('content') ?? '';

  it.each([
    ['dist/about/index.html', '/'],
    ['dist/resume/index.html', '/cv/'],
    ['dist/posts/index.html', '/writing/'],
  ])('%s redirects to %s', (file, target) => {
    expect(existsSync(file), file).toBe(true);
    expect(refresh(file)).toMatch(new RegExp(`url=${target.replace(/\//g, '\\/')}$`));
  });

  it('old post urls redirect to /writing/<slug>/', () => {
    for (const s of sourceSlugs('src/content/posts', { drafts: false })) {
      const file = `dist/posts/${s}/index.html`;
      expect(existsSync(file), file).toBe(true);
      expect(refresh(file)).toMatch(new RegExp(`url=/writing/${s}/?$`));
    }
  });

  it('tag archives are gone', () => {
    expect(existsSync('dist/tags')).toBe(false);
  });
});

describe('feeds and 404', () => {
  it('rss.xml has one item per published post, linking to /writing/', () => {
    const xml = readFileSync('dist/rss.xml', 'utf8');
    const slugs = sourceSlugs('src/content/posts', { drafts: false });
    expect(xml).toContain('<rss');
    expect((xml.match(/<item>/g) ?? []).length).toBe(slugs.length);
    for (const s of slugs) expect(xml).toContain(`/writing/${s}/`);
    expect(xml).not.toContain('/posts/');
  });

  it('index.xml alias and sitemap exist', () => {
    expect(readFileSync('dist/index.xml', 'utf8')).toContain('<rss');
    expect(existsSync('dist/sitemap-index.xml')).toBe(true);
  });

  it('404 page has a 404 heading and a link home', () => {
    const doc = $('dist/404.html');
    expect(doc('h1').text()).toMatch(/404/);
    expect(doc('a[href="/"]').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: 跑測試，確認是紅的**

Run: `npx vitest run tests/text.test.ts tests/content.test.ts`
Expected: `text.test.ts` 整檔 FAIL（`Cannot find module '../src/lib/text'`）；`content.test.ts` 的「no post uses removed fields」FAIL（現有文章有 `categories:`）。
（`build.test.ts` 先不跑，舊頁面會讓它失敗，這是預期。）

- [ ] **Step 6: Commit**

```bash
git add tests/build.test.ts tests/content.test.ts tests/text.test.ts
git commit -m "$(cat <<'EOF'
test: specify the minimal text-first redesign

Replaces the V6 assertions with the new DOM contract: four-route
structure, zero <script>, no webfonts, year-grouped writing list,
redirects from the old paths, CJK-aware reading time.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"
```

---

### Task 2: 拆除 V6 — 刪頁面、元件、舊內容、React/MDX 依賴；精簡 schema；新 `lib/text.ts`

**Files:**
- Delete: `src/pages/about.astro`, `src/pages/resume.astro`, `src/pages/posts/index.astro`, `src/pages/posts/[...slug].astro`, `src/pages/projects/index.astro`, `src/pages/projects/[...slug].astro`, `src/pages/tags/[tag].astro`, `src/pages/index.astro`, `src/pages/404.astro`
- Delete: `src/components/AgentREPL.tsx`, `src/components/StreamItem.tsx`, `src/components/TopBar.astro`, `src/components/TerminalPanel.astro`, `src/components/ToolCall.astro`, `src/components/BelowCard.astro`, `src/components/TomlBlock.astro`, `src/components/ProjectCard.astro`, `src/components/GitLogRow.astro`
- Delete: 5 篇 2025 文章、2 個 project 檔（清單見 spec §4）
- Modify: `src/content/posts/rebuilding-my-site-as-an-agent.md`、`src/content/posts/little-leo-workspace-to-system.md`（去掉 `categories`、`author`）
- Modify: `src/content.config.ts`
- Create: `src/lib/text.ts`
- Modify: `src/lib/posts.ts`
- Modify: `src/styles/global.css`（清空，Task 3 重寫）
- Modify: `package.json`, `package-lock.json`, `tsconfig.json`, `astro.config.mjs`

**Interfaces:**
- Produces:
  - `src/lib/text.ts`: `formatDate(d: Date): string`（YYYY-MM-DD，Asia/Taipei）、`yearOf(d: Date): string`、`readingMinutes(body: string): number`。
  - `src/lib/posts.ts`: `getPublishedPosts(): Promise<CollectionEntry<'posts'>[]>`（draft 過濾、日期降冪）、`getPostStats(post): { words: number; readMin: number; dateStr: string }`。
  - `posts` schema 欄位：`title, date, summary, tags?, draft?, featured?, lang?`。

- [ ] **Step 1: 刪除舊頁面、元件、內容**

```bash
git rm -q src/pages/about.astro src/pages/resume.astro src/pages/index.astro src/pages/404.astro \
  'src/pages/posts/index.astro' 'src/pages/posts/[...slug].astro' \
  'src/pages/projects/index.astro' 'src/pages/projects/[...slug].astro' \
  'src/pages/tags/[tag].astro'
git rm -q src/components/AgentREPL.tsx src/components/StreamItem.tsx src/components/TopBar.astro \
  src/components/TerminalPanel.astro src/components/ToolCall.astro src/components/BelowCard.astro \
  src/components/TomlBlock.astro src/components/ProjectCard.astro src/components/GitLogRow.astro
git rm -q src/content/posts/hello-world.md src/content/posts/getting-started-with-machine-learning.md \
  src/content/posts/python-virtual-environments-quick-guide.md src/content/posts/top-programming-tools-workflow.md \
  src/content/posts/building-hugo-blog-lessons-learned.md \
  src/content/projects/ai-blog-assistant.md src/content/projects/edge-deployment-monitor.md
rmdir src/pages/tags
```

- [ ] **Step 2: 清掉兩篇保留文章的 `categories` / `author`，並把 little-leo 文章加進 git**

```bash
sed -i '' -e '/^categories:/d' -e '/^author:/d' \
  src/content/posts/rebuilding-my-site-as-an-agent.md \
  src/content/posts/little-leo-workspace-to-system.md
git add src/content/posts/little-leo-workspace-to-system.md
head -12 src/content/posts/rebuilding-my-site-as-an-agent.md
```
Expected: frontmatter 只剩 `title, date, draft, tags, summary, featured`（little-leo 多一個 `lang: zh-TW`）。

- [ ] **Step 3: 精簡 `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
    lang: z.enum(['en', 'zh-TW']).optional().default('en'),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional().default(false),
    summary: z.string(),
    technologies: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    status: z.enum(['shipped', 'archived', 'private', 'wip']).optional().default('shipped'),
    project_url: z.url().optional(),
  }),
});

export const collections = { posts, projects };
```

（`projects` 只拿掉 `categories`，因為沒有頁面用它；其餘不動。）

- [ ] **Step 4: 新增 `src/lib/text.ts`（純函式，不 import astro）**

```ts
const WORDS_PER_MINUTE = 220;
const CJK_CHARS_PER_MINUTE = 400;
const SITE_TZ = 'Asia/Taipei';
const CJK = /[㐀-鿿豈-﫿]/g;

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD in Asia/Taipei. */
export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

/** Four-digit year in Asia/Taipei, for grouping lists. */
export function yearOf(d: Date): string {
  return formatDate(d).slice(0, 4);
}

/** Reading time: CJK characters at 400/min plus latin words at 220/min, minimum 1. */
export function readingMinutes(body: string): number {
  const cjk = (body.match(CJK) ?? []).length;
  const latinWords = body.replace(CJK, ' ').trim().split(/\s+/).filter(Boolean).length;
  const minutes = cjk / CJK_CHARS_PER_MINUTE + latinWords / WORDS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}
```

- [ ] **Step 5: 跑 text 測試，確認綠**

Run: `npx vitest run tests/text.test.ts`
Expected: 6 passed。

- [ ] **Step 6: 改寫 `src/lib/posts.ts`**

```ts
import { getCollection, type CollectionEntry } from 'astro:content';
import { formatDate, readingMinutes } from './text';

type Post = CollectionEntry<'posts'>;

export interface PostStats {
  words: number;
  readMin: number;
  dateStr: string;
}

function bodyOf(post: Post): string {
  return (post as unknown as { body?: string }).body ?? '';
}

export function getPostStats(post: Post): PostStats {
  const body = bodyOf(post);
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return {
    words,
    readMin: readingMinutes(body),
    dateStr: formatDate(post.data.date),
  };
}

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', (p) => p.data.draft !== true);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
```

- [ ] **Step 7: 清空 `src/styles/global.css`（Task 3 重寫）**

```bash
: > src/styles/global.css
```

- [ ] **Step 8: 移除 React 與 MDX 依賴，修 audit，minor bump**

```bash
npm uninstall react react-dom @types/react @types/react-dom @astrojs/react @astrojs/mdx
npm update
npm audit fix
npm ls --depth=0
```
Expected: `npm ls` 只列 `@astrojs/check`、`@astrojs/rss`、`@astrojs/sitemap`、`astro`（6.x）、`cheerio`、`typescript`、`vitest`。
若 `npm audit fix` 後仍有漏洞，跑 `npm audit` 看是不是只剩 dev-side（vite / svgo），是的話接受，在 commit body 記一行。
**不要**跑 `npm audit fix --force`（會跨大版）。

- [ ] **Step 9: 改 `astro.config.mjs`（拿掉 react/mdx，加 redirects）**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://leonardofhy.github.io/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
  redirects: {
    '/about': '/',
    '/resume': '/cv/',
    '/posts': '/writing/',
    '/posts/[...slug]': '/writing/[...slug]/',
  },
});
```

- [ ] **Step 10: 改 `tsconfig.json`（拿掉 React JSX 與 Hugo 時代 exclude）**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*", "tests/**/*", "astro.config.mjs"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 11: 確認 content 測試綠、`astro check` 乾淨**

Run: `npx vitest run tests/content.test.ts tests/text.test.ts && npx astro sync && npx astro check`
Expected: 測試全綠；`astro check` 0 errors（此時沒有任何頁面，這是正常的；`astro check` 可能警告沒有 pages，可忽略）。

- [ ] **Step 12: Commit（兩個 commit：內容、程式）**

```bash
git add src/content/posts src/content/projects
git commit -m "$(cat <<'EOF'
content: drop placeholder posts and projects, keep the two 2026 posts

Removes five generic 2025 tutorial posts and two concept projects.
Adds the little-leo post that was written in April but never committed.
Strips the categories/author fields that the new schema no longer has.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"

git add src/pages src/components src/content.config.ts src/lib/text.ts src/lib/posts.ts \
  src/styles/global.css package.json package-lock.json tsconfig.json astro.config.mjs
git commit -m "$(cat <<'EOF'
refactor: remove the V6 terminal UI, React and MDX

Deletes every V6 page and component, the React islands and their
dependencies. Posts schema keeps only the fields that are rendered.
Reading time now counts CJK characters. Redirects map the old routes
to the new ones that the following commits add.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"
```

---

### Task 3: 視覺系統、layout、頁首頁尾、首頁、404

**Files:**
- Create: `src/lib/site.ts`
- Modify: `src/styles/global.css`（整檔寫入）
- Modify: `src/layouts/BaseLayout.astro`
- Create: `src/components/SiteHeader.astro`, `src/components/SiteFooter.astro`, `src/components/PostList.astro`
- Create: `src/pages/index.astro`, `src/pages/404.astro`

**Interfaces:**
- Consumes: `getPublishedPosts`、`formatDate`、`yearOf`（Task 2）。
- Produces:
  - `src/lib/site.ts`: `SITE { name, fullName, zhName, description }`, `NavKey = 'home' | 'writing' | 'projects' | 'cv'`, `NAV`, `LINKS`。
  - `BaseLayout` props: `title: string; description: string; lang?: 'en' | 'zh-TW'; active?: NavKey`。內含 header / `<main>` / footer。
  - `PostList` props: `posts: CollectionEntry<'posts'>[]; groupByYear?: boolean`。

- [ ] **Step 1: 寫 `src/lib/site.ts`**

```ts
export const SITE = {
  name: 'Leonardo Foo',
  fullName: 'Leonardo Foo Haw Yang',
  zhName: '胡皓雍',
  description:
    'Leonardo Foo Haw Yang — M.S. student at NTU, AI safety and practical evaluation, organizer of NTUAIS. Taipei.',
} as const;

export type NavKey = 'home' | 'writing' | 'projects' | 'cv';

export const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'writing', label: 'writing', href: '/writing/' },
  { key: 'projects', label: 'projects', href: '/projects/' },
  { key: 'cv', label: 'cv', href: '/cv/' },
];

export const LINKS: { label: string; href: string }[] = [
  { label: 'github', href: 'https://github.com/leonardofhy' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/leonardo-fhy/' },
  { label: 'rss', href: '/rss.xml' },
];
```

- [ ] **Step 2: 寫 `src/styles/global.css`**

```css
/* Minimal text-first design (2026-10). Light only, system fonts, no JS. */

:root {
  --bg: #ffffff;
  --fg: #1a1a1a;
  --muted: #6b6b6b;
  --link: #1f4e79;
  --rule: #e5e5e5;
  --code-bg: #f4f4f4;
  --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "PingFang TC", "Noto Sans TC", sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --measure: 42rem;
}

* { box-sizing: border-box; }

html {
  font-family: var(--sans);
  font-size: 17px;
  line-height: 1.6;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
}

.wrap {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 0 16px;
}

a {
  color: var(--link);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}
a:hover { text-decoration-thickness: 2px; }

/* ---- chrome ---- */
.site-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 2rem 0 2.5rem;
}
.site-header .name {
  font-weight: 600;
  color: var(--fg);
  text-decoration: none;
}
.site-header nav a {
  margin-left: 1.25rem;
  color: var(--muted);
  text-decoration: none;
}
.site-header nav a:hover { color: var(--fg); }
.site-header nav a[aria-current="page"] {
  color: var(--fg);
  text-decoration: underline;
}

main { padding-bottom: 3rem; }

.site-footer {
  border-top: 1px solid var(--rule);
  padding: 1.5rem 0 3rem;
  color: var(--muted);
  font-size: 0.9rem;
}
.site-footer a { margin-right: 1rem; color: var(--muted); }

/* ---- type ---- */
h1 { font-size: 1.6rem; line-height: 1.25; margin: 0 0 0.5rem; font-weight: 600; }
h2 { font-size: 1.1rem; margin: 2.5rem 0 0.75rem; font-weight: 600; }
h3 { font-size: 1rem; margin: 1.5rem 0 0.5rem; font-weight: 600; }
p { margin: 0 0 1rem; }
ul, ol { padding-left: 1.25rem; }
.muted { color: var(--muted); }
.lede { font-size: 1.05rem; }

/* ---- post list ---- */
.year h2 { margin-top: 2rem; }
.post-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.post-list li {
  display: flex;
  gap: 1rem;
  margin: 0.35rem 0;
}
.post-list time {
  flex: 0 0 6.5rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

/* ---- article ---- */
article header { margin-bottom: 1.5rem; }
article :is(h2, h3) { margin-top: 2rem; }
article img { max-width: 100%; height: auto; }
article pre {
  font-family: var(--mono);
  font-size: 0.85rem;
  line-height: 1.5;
  padding: 1rem;
  overflow-x: auto;
  background: var(--code-bg);
  border-radius: 4px;
}
article code { font-family: var(--mono); font-size: 0.9em; }
article :not(pre) > code {
  background: var(--code-bg);
  padding: 0.1em 0.3em;
  border-radius: 3px;
}
article blockquote {
  margin: 1rem 0;
  padding-left: 1rem;
  border-left: 3px solid var(--rule);
  color: var(--muted);
}
article table { border-collapse: collapse; width: 100%; font-size: 0.95rem; }
article th, article td {
  border-bottom: 1px solid var(--rule);
  padding: 0.4rem 0.6rem;
  text-align: left;
}
html[lang="zh-Hant-TW"] article { line-height: 1.75; }

/* ---- projects ---- */
.project { margin: 0 0 1.75rem; }
.project h3 { margin-top: 0; }
.project .meta { color: var(--muted); font-size: 0.9rem; }

/* ---- cv ---- */
.cv-entry {
  display: grid;
  grid-template-columns: 9rem 1fr;
  gap: 0.25rem 1rem;
  margin: 0 0 1.25rem;
}
.cv-entry .when { color: var(--muted); font-variant-numeric: tabular-nums; }
.cv-entry .role { color: var(--muted); }
.cv-entry ul { margin: 0.25rem 0 0; padding-left: 1.1rem; }
.skills dt { font-weight: 600; margin-top: 0.5rem; }
.skills dd { margin: 0; color: var(--muted); }

/* ---- phone ---- */
@media (max-width: 480px) {
  .site-header { flex-direction: column; gap: 0.5rem; }
  .site-header nav a { margin-left: 0; margin-right: 1.25rem; }
  .post-list li { flex-direction: column; gap: 0; margin-bottom: 0.75rem; }
  .cv-entry { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: 寫 `src/components/SiteHeader.astro`**

```astro
---
import { SITE, NAV, type NavKey } from '../lib/site';

interface Props {
  active?: NavKey;
}
const { active } = Astro.props;
---
<header class="site-header">
  <a class="name" href="/">{SITE.name}</a>
  <nav aria-label="Site">
    {NAV.map((n) => (
      <a href={n.href} aria-current={active === n.key ? 'page' : undefined}>{n.label}</a>
    ))}
  </nav>
</header>
```

- [ ] **Step 4: 寫 `src/components/SiteFooter.astro`**

```astro
---
import { LINKS } from '../lib/site';
---
<footer class="site-footer">
  {LINKS.map((l) => <a href={l.href}>{l.label}</a>)}
</footer>
```

- [ ] **Step 5: 改寫 `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';
import type { NavKey } from '../lib/site';

interface Props {
  title: string;
  description: string;
  lang?: 'en' | 'zh-TW';
  active?: NavKey;
}

const { title, description, lang = 'en', active } = Astro.props;
const htmlLang = lang === 'zh-TW' ? 'zh-Hant-TW' : 'en';
const site = Astro.site ?? new URL('https://leonardofhy.github.io/');
const ogImage = new URL('/images/portrait.jpg', site).toString();
const canonical = new URL(Astro.url.pathname, site).toString();
---
<!doctype html>
<html lang={htmlLang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <link rel="alternate" type="application/rss+xml" title="Leonardo Foo" href="/rss.xml" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={ogImage} />
  </head>
  <body>
    <div class="wrap">
      <SiteHeader active={active} />
      <main>
        <slot />
      </main>
      <SiteFooter />
    </div>
  </body>
</html>
```

- [ ] **Step 6: 寫 `src/components/PostList.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { formatDate, yearOf } from '../lib/text';

type Post = CollectionEntry<'posts'>;

interface Props {
  posts: Post[];
  groupByYear?: boolean;
}
const { posts, groupByYear = false } = Astro.props;

const groups = new Map<string, Post[]>();
for (const p of posts) {
  const key = groupByYear ? yearOf(p.data.date) : '';
  groups.set(key, [...(groups.get(key) ?? []), p]);
}
---
{[...groups.entries()].map(([year, items]) => (
  <section class="year">
    {groupByYear && <h2>{year}</h2>}
    <ul class="post-list">
      {items.map((p) => (
        <li>
          <time datetime={p.data.date.toISOString()}>{formatDate(p.data.date)}</time>
          <a href={`/writing/${p.id}/`} lang={p.data.lang === 'zh-TW' ? 'zh-Hant-TW' : undefined}>
            {p.data.title}
          </a>
        </li>
      ))}
    </ul>
  </section>
))}
```

- [ ] **Step 7: 寫 `src/pages/index.astro`**

自介文字取自原 about 頁，不新增任何事實。

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import PostList from '../components/PostList.astro';
import { getPublishedPosts } from '../lib/posts';
import { SITE, LINKS } from '../lib/site';

const posts = (await getPublishedPosts()).slice(0, 3);
const projects = (await getCollection('projects', (p) => p.data.draft !== true && p.data.featured))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
  .slice(0, 3);
const contact = LINKS.filter((l) => l.label !== 'rss');
---
<BaseLayout title={SITE.fullName} description={SITE.description} active="home">
  <section id="intro">
    <h1>{SITE.fullName} <span class="muted">{SITE.zhName}</span></h1>
    <p class="lede">
      M.S. student in Communication Engineering at National Taiwan University.
      AI safety, practical evaluation, and organizer of NTUAIS (NTU AI Safety). Taipei.
    </p>
    <p>
      I care about building practical AI systems and advancing responsible AI deployment,
      and I enjoy connecting people through ideas and community work around AI safety,
      research, and societal impact.
    </p>
  </section>

  <section id="selected-work">
    <h2>Selected work</h2>
    {projects.length === 0 ? (
      <p class="muted">coming soon</p>
    ) : (
      <ul class="post-list">
        {projects.map((p) => (
          <li>
            <a href={p.data.project_url ?? `/projects/${p.id}/`}>{p.data.title}</a>
            <span class="muted">{p.data.summary}</span>
          </li>
        ))}
      </ul>
    )}
  </section>

  <section id="writing">
    <h2>Writing</h2>
    <PostList posts={posts} />
    <p><a href="/writing/">All posts</a></p>
  </section>

  <section id="contact">
    <h2>Contact</h2>
    <p>
      {contact.map((l, i) => (
        <>
          {i > 0 && ' · '}
          <a href={l.href}>{l.label}</a>
        </>
      ))}
    </p>
  </section>
</BaseLayout>
```

- [ ] **Step 8: 寫 `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="404 — not found" description="This page does not exist.">
  <h1>404</h1>
  <p>Page not found. <a href="/">Back to the home page.</a></p>
</BaseLayout>
```

- [ ] **Step 9: 跑建置測試的 build / chrome / home 區塊**

Run: `npx vitest run tests/build.test.ts -t "build|site chrome|home|404"`
Expected: `build`、`site chrome` 中關於 index 的、`home`、`404` 全 PASS。`site chrome` 的 aria-current 測試會因為 `dist/writing/index.html` 還不存在而 FAIL，這是預期，Task 4–6 補上。

- [ ] **Step 10: 用瀏覽器看一眼**

Run: `npm run dev` 然後開 `http://localhost:4321/`。
確認：單欄、白底、名字 + 三個導覽、四個區塊、頁尾三個連結、手機寬度（DevTools 375px）沒有橫向捲動。看完 Ctrl-C。

- [ ] **Step 11: Commit**

```bash
git add src/lib/site.ts src/styles/global.css src/layouts/BaseLayout.astro \
  src/components/SiteHeader.astro src/components/SiteFooter.astro src/components/PostList.astro \
  src/pages/index.astro src/pages/404.astro
git commit -m "$(cat <<'EOF'
feat: minimal layout, site chrome, home page and 404

Light, one-column, system-font design with zero JavaScript. BaseLayout
now owns the header, footer, canonical and RSS links.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"
```

---

### Task 4: writing 列表、文章頁、RSS

**Files:**
- Create: `src/pages/writing/index.astro`, `src/pages/writing/[...slug].astro`
- Modify: `src/pages/rss.xml.ts`

**Interfaces:**
- Consumes: `BaseLayout`、`PostList`（Task 3）；`getPublishedPosts`、`getPostStats`（Task 2）。

- [ ] **Step 1: 寫 `src/pages/writing/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PostList from '../../components/PostList.astro';
import { getPublishedPosts } from '../../lib/posts';

const posts = await getPublishedPosts();
---
<BaseLayout title="Writing — Leonardo Foo" description="Posts by Leonardo Foo Haw Yang." active="writing">
  <h1>Writing</h1>
  <PostList posts={posts} groupByYear />
</BaseLayout>
```

- [ ] **Step 2: 寫 `src/pages/writing/[...slug].astro`**

```astro
---
import { render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getPublishedPosts, getPostStats } from '../../lib/posts';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);
const stats = getPostStats(post);
---
<BaseLayout
  title={`${post.data.title} — Leonardo Foo`}
  description={post.data.summary}
  lang={post.data.lang}
  active="writing"
>
  <article>
    <header>
      <h1>{post.data.title}</h1>
      <p class="muted">
        <time datetime={post.data.date.toISOString()}>{stats.dateStr}</time>
        {' · '}{stats.readMin} min read
      </p>
    </header>
    <Content />
  </article>
</BaseLayout>
```

- [ ] **Step 3: 改 `src/pages/rss.xml.ts`**

```ts
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/posts';
import { SITE } from '../lib/site';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: SITE.fullName,
    description: SITE.description,
    site: context.site ?? 'https://leonardofhy.github.io/',
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
      link: `/writing/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: `<language>en</language>`,
  });
}
```

`src/pages/index.xml.ts` 不動（它 re-export `GET`）。

- [ ] **Step 4: 跑 writing 與 feeds 測試**

Run: `npx vitest run tests/build.test.ts -t "writing|feeds|site chrome"`
Expected: `writing`、`feeds and 404` 全 PASS；`site chrome` 的 aria-current 測試仍因 `dist/projects/`、`dist/cv/` 不存在而 FAIL（Task 5、6 補）。

- [ ] **Step 5: Commit**

```bash
git add src/pages/writing src/pages/rss.xml.ts
git commit -m "$(cat <<'EOF'
feat: writing list grouped by year, post pages, rss under /writing/

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"
```

---

### Task 5: projects 列表與詳細頁

**Files:**
- Create: `src/components/ProjectEntry.astro`, `src/pages/projects/index.astro`, `src/pages/projects/[...slug].astro`

**Interfaces:**
- Consumes: `BaseLayout`（Task 3）、`formatDate`（Task 2）。
- Produces: `ProjectEntry` props: `project: CollectionEntry<'projects'>`。

- [ ] **Step 1: 寫 `src/components/ProjectEntry.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  project: CollectionEntry<'projects'>;
}
const { project } = Astro.props;
const { title, summary, technologies, status, project_url } = project.data;
const href = project_url ?? `/projects/${project.id}/`;
const external = project_url ? { target: '_blank', rel: 'noopener noreferrer' } : {};
const meta = [...technologies, status].join(' · ');
---
<section class="project">
  <h3><a href={href} {...external}>{title}</a></h3>
  <p>{summary}</p>
  <p class="meta">{meta}</p>
</section>
```

- [ ] **Step 2: 寫 `src/pages/projects/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import ProjectEntry from '../../components/ProjectEntry.astro';

const projects = (await getCollection('projects', (p) => p.data.draft !== true))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
---
<BaseLayout title="Projects — Leonardo Foo" description="Things Leonardo Foo Haw Yang has built." active="projects">
  <h1>Projects</h1>
  {projects.length === 0 ? (
    <p class="muted">coming soon</p>
  ) : (
    projects.map((p) => <ProjectEntry project={p} />)
  )}
</BaseLayout>
```

- [ ] **Step 3: 寫 `src/pages/projects/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { formatDate } from '../../lib/text';

export async function getStaticPaths() {
  const projects = await getCollection('projects', (p) => p.data.draft !== true);
  return projects.map((project) => ({ params: { slug: project.id }, props: { project } }));
}

const { project } = Astro.props;
const { Content } = await render(project);
const d = project.data;
const meta = [d.status, ...d.technologies].join(' · ');
---
<BaseLayout title={`${d.title} — Leonardo Foo`} description={d.summary} active="projects">
  <article>
    <header>
      <h1>{d.title}</h1>
      <p class="muted">
        <time datetime={d.date.toISOString()}>{formatDate(d.date)}</time>
        {' · '}{meta}
        {d.project_url && (
          <>
            {' · '}
            <a href={d.project_url} target="_blank" rel="noopener noreferrer">link</a>
          </>
        )}
      </p>
    </header>
    <Content />
  </article>
</BaseLayout>
```

- [ ] **Step 4: 跑 projects 測試（空集合路徑）**

Run: `npx vitest run tests/build.test.ts -t "projects"`
Expected: 2 passed（`coming soon` 分支；detail 迴圈零次）。

- [ ] **Step 5: 用一個臨時 project 驗證非空路徑，驗完刪掉**

```bash
cat > src/content/projects/_tmp.md <<'EOF'
---
title: "Temp Project"
date: 2026-10-11
summary: "Temporary fixture for verifying the non-empty path."
technologies: ["Astro"]
status: wip
featured: true
---

Body paragraph.
EOF
npx vitest run tests/build.test.ts -t "projects|home"
rm src/content/projects/_tmp.md
```
Expected: 第一次跑 `projects` 與 `home` 全 PASS（列表 1 個 `section.project`、detail 頁存在、首頁 selected work 1 個 `li`）。刪掉後 `git status` 不得出現 `_tmp.md`。

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectEntry.astro src/pages/projects
git commit -m "$(cat <<'EOF'
feat: projects list and detail pages with empty-collection fallback

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"
```

---

### Task 6: CV 資料與頁面

**Files:**
- Create: `src/data/cv.ts`, `src/components/CvEntry.astro`, `src/pages/cv.astro`

**Interfaces:**
- Consumes: `BaseLayout`（Task 3）。
- Produces: `src/data/cv.ts` 匯出 `interface CvEntry { when: string; org: string; role: string; notes: string[] }`、`education: CvEntry[]`、`experience: CvEntry[]`、`skills: [string, string[]][]`。

- [ ] **Step 1: 寫 `src/data/cv.ts`**

只放 spec §4 列出的事實。附註文字直接沿用原 `resume.astro`。

```ts
export interface CvEntry {
  when: string;
  org: string;
  role: string;
  notes: string[];
}

export const education: CvEntry[] = [
  {
    when: 'Sep 2023 – present',
    org: 'National Taiwan University',
    role: 'M.S. in Communication Engineering',
    notes: ['focus: deep learning · computer vision', 'research: ai safety · practical eval'],
  },
  {
    when: 'Sep 2019 – Jun 2023',
    org: 'National Taiwan University',
    role: 'B.S. in Electrical Engineering',
    notes: [],
  },
];

export const experience: CvEntry[] = [
  {
    when: '2024 – present',
    org: 'NTUAIS (NTU AI Safety)',
    role: 'Organizer',
    notes: [
      'organize discussions, speaker sessions, student-led activities',
      'connect researchers + students for practical safety insights',
    ],
  },
];

export const skills: [string, string[]][] = [
  ['languages', ['python', 'c++', 'javascript', 'go']],
  ['ai/ml', ['pytorch', 'tensorflow', 'opencv', 'huggingface', 'safe-ai-eval']],
  ['web', ['astro', 'react', 'node.js', 'gh-actions']],
  ['tools', ['docker', 'git', 'linux', 'aws']],
];
```

- [ ] **Step 2: 寫 `src/components/CvEntry.astro`**

```astro
---
import type { CvEntry } from '../data/cv';

interface Props {
  entry: CvEntry;
}
const { entry } = Astro.props;
---
<div class="cv-entry">
  <span class="when">{entry.when}</span>
  <div>
    <div class="org">{entry.org}</div>
    <div class="role">{entry.role}</div>
    {entry.notes.length > 0 && (
      <ul>
        {entry.notes.map((n) => <li>{n}</li>)}
      </ul>
    )}
  </div>
</div>
```

- [ ] **Step 3: 寫 `src/pages/cv.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import CvEntry from '../components/CvEntry.astro';
import { education, experience, skills } from '../data/cv';
import { SITE } from '../lib/site';
---
<BaseLayout title="CV — Leonardo Foo" description={`CV of ${SITE.fullName}.`} active="cv">
  <h1>{SITE.fullName}</h1>
  <p class="muted">Taipei, Taiwan · UTC+8</p>

  <section id="education">
    <h2>Education</h2>
    {education.map((e) => <CvEntry entry={e} />)}
  </section>

  <section id="experience">
    <h2>Experience</h2>
    {experience.map((e) => <CvEntry entry={e} />)}
  </section>

  <section id="skills">
    <h2>Skills</h2>
    <dl class="skills">
      {skills.map(([k, v]) => (
        <>
          <dt>{k}</dt>
          <dd>{v.join(', ')}</dd>
        </>
      ))}
    </dl>
  </section>
</BaseLayout>
```

- [ ] **Step 4: 跑 cv 與 chrome 測試**

Run: `npx vitest run tests/build.test.ts -t "cv|site chrome"`
Expected: 全 PASS（此時 writing / projects / cv 三頁都存在，aria-current 測試綠）。

- [ ] **Step 5: Commit**

```bash
git add src/data/cv.ts src/components/CvEntry.astro src/pages/cv.astro
git commit -m "$(cat <<'EOF'
feat: cv page from typed data, seeded with known facts only

Drops the placeholder internship and email from the old resume page.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"
```

---

### Task 7: Redirects 驗證與全套測試

**Files:**
- Modify（只在需要時）: `astro.config.mjs`

- [ ] **Step 1: 跑 redirects 測試**

Run: `npx vitest run tests/build.test.ts -t "redirects"`
Expected: 全 PASS。

如果 `old post urls redirect` FAIL 而且 `dist/posts/<slug>/index.html` 不存在：把 `astro.config.mjs` 的 key 改成帶尾斜線 `'/posts/[...slug]/': '/writing/[...slug]/'`，重跑。兩種寫法擇一讓測試綠即可，不要兩種都留。
如果 meta refresh 的 url 缺尾斜線（`url=/writing/<slug>`）：測試的 regex 允許，接受；GitHub Pages 會對目錄路徑補尾斜線。

- [ ] **Step 2: 跑全套**

Run: `set -o pipefail; npm test 2>&1 | tail -15`
Expected: 3 個測試檔全 PASS，0 failed。把實際輸出的 summary 貼進回報。

- [ ] **Step 3: 跑完整建置（含 `astro check`）**

Run: `npm run build 2>&1 | tail -20`
Expected: `astro check` 0 errors、0 warnings 關於型別；build 完成。

- [ ] **Step 4: Commit（若 Step 1 有改 config）**

```bash
git add astro.config.mjs
git commit -m "$(cat <<'EOF'
fix: redirect key form for dynamic post paths

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"
```

---

### Task 8: 文件更新與 PR

**Files:**
- Modify: `README.md`, `CLAUDE.md`
- Modify: `.claude/skills/atomic-commits.md`（只改 Co-Authored-By 行）

- [ ] **Step 1: 改寫 `README.md`**

```markdown
# leonardofhy.github.io

Personal site for Leonardo Foo Haw Yang (胡皓雍). Astro, static output,
GitHub Pages. Light, one-column, text-first design with zero JavaScript.

Live at **https://leonardofhy.github.io**.

History: Hugo + PaperMod until 2026-04 (tag `hugo-v6-final`), then a
Claude Code-style terminal UI on Astro until 2026-10 (tag `v6-final`).

## Local development

Node 20+ (CI uses 22).

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
```

- [ ] **Step 2: 改寫 `CLAUDE.md`**

```markdown
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
```

- [ ] **Step 3: 修 `.claude/skills/atomic-commits.md` 的 Co-Authored-By 行**

```bash
sed -i '' 's/Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>/Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>/' .claude/skills/atomic-commits.md
```

- [ ] **Step 4: 為舊設計打 tag（在 `main` 的最後一個 V6 commit 上）**

```bash
git tag -a v6-final b8d24df -m "Last commit of the V6 terminal UI before the 2026-10 minimal redesign"
```

- [ ] **Step 5: Commit 文件**

```bash
git add README.md CLAUDE.md .claude/skills/atomic-commits.md
git commit -m "$(cat <<'EOF'
docs: rewrite README and CLAUDE.md for the minimal redesign

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"
```

- [ ] **Step 6: 最後一次全套驗證並貼出輸出**

```bash
set -o pipefail
npm test 2>&1 | tail -8
npm run build 2>&1 | tail -5
git status --short
```
Expected: 測試 0 failed；build 成功；working tree 乾淨。

- [ ] **Step 7: Push 分支與 tag，開 PR**

```bash
git push -u origin redesign/minimal
git push origin v6-final
gh pr create --title "Minimal text-first redesign" --body "$(cat <<'EOF'
## Summary

- Replace the V6 terminal UI with a light, one-column, zero-JS text-first design
- Four routes: `/`, `/writing/`, `/projects/`, `/cv/`; old paths redirect
- Drop placeholder posts/projects and the fake résumé entries; add the unpublished little-leo post
- Remove React, MDX and their dependencies; `npm audit fix`
- New test suite asserts structure, zero `<script>`, no webfonts, redirects, CJK reading time

Spec: `docs/superpowers/specs/2026-10-11-minimal-redesign-design.md`
Plan: `docs/superpowers/plans/2026-10-11-minimal-redesign.md`

## Still needed from the author (not in this PR)

Email, current M.S. status, real experience entries, selected projects, publications (spec §9).

## Test plan

- [ ] `npm test` green locally and in CI
- [ ] `npm run preview`: home, writing, a post, projects, cv, 404 at desktop and 375px
- [ ] `/about/`, `/resume/`, `/posts/rebuilding-my-site-as-an-agent/` redirect

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01Pb7a3JRYL2ergRVEDw2kcZ
EOF
)"
```

Merge 由使用者決定；merge 到 `main` 即部署。
