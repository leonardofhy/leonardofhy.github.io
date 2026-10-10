# 極簡純文字重新設計 — 設計規格

日期：2026-10-11
狀態：對話中已確認，等待書面審閱

## 1. 目的

把網站變成「研究／求職名片」：PhD 審查委員、實習招募者、潛在合作者第一個打開的頁面。文章保留在站上，但退居次要。

不做的事：深色模式、互動 island、串流 Claude endpoint、Astro 7 大版升級（另開 task）、以任何形式保留 V6 終端機風格。

## 2. 視覺系統

- **排版。** 單欄置中，`max-width: 42rem`。手機兩側 16px 邊距。沒有側欄、卡片、陰影、邊框區塊。區塊之間只用留白與小標題分隔。
- **字型。** 只用系統字型，不載入 webfont。
  - 內文：`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang TC", "Noto Sans TC", sans-serif`
  - 程式碼：`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
  - 內文 17px、行高 1.6。`lang: zh-TW` 的文章行高 1.75。
- **色彩。** 只有淺色。白底、近黑文字、灰色日期與附註、一個低飽和連結色加底線。色彩 token 放在 `src/styles/global.css` 的 `:root`。
- **導覽。** 頁首：左邊名字（連回 `/`），右邊 `writing · projects · cv`。頁尾：github、linkedin、rss。email 等使用者提供後再加。
- **JavaScript。** 零。沒有 island。建置出的 HTML 不含任何 `<script>` 標籤（由測試強制）。

## 3. 頁面

| 路由 | 內容 |
|---|---|
| `/` | 名字 + 一行身份（研究方向、單位、城市）。2–3 句自我介紹。「Selected work」：最多 3 個 `featured` project。「Writing」：最近 3 篇。「Contact」：連結列。 |
| `/writing/` | 所有非 draft 文章，按年份分組，每篇一行：日期 + 標題。 |
| `/writing/[slug]/` | 標題、日期、閱讀分鐘數、內文。不做上一篇／下一篇，不做 tag 頁。 |
| `/projects/` | 每個 project 一個區塊：標題（有 `project_url` 則外連）、摘要、技術、狀態。 |
| `/projects/[slug]/` | 標題、meta、內文。保留給之後有長說明的 project。 |
| `/cv/` | Education、Experience、Skills。每個條目：時間 · 機構 · 角色 · 1–2 點附註。資料來自 `src/data/cv.ts`。 |
| `/404.html` | 純文字「not found」+ 回首頁連結。 |

空集合行為：`projects` 沒有任何條目時，首頁「Selected work」與 `/projects/` 顯示一行「coming soon」，建置不得失敗。

移除的路由：`/about/`、`/resume/`、`/posts/`、`/posts/[slug]/`、`/tags/[tag]/`。

## 4. 資料與內容

### 集合（`src/content.config.ts`）

`posts` schema（只留實際會渲染的欄位）：

| 欄位 | 必填 | 型別 |
|---|---|---|
| `title` | 是 | string |
| `date` | 是 | coerced Date |
| `summary` | 是 | string |
| `tags` | 否 | string[] |
| `draft` | 否 | boolean，預設 false |
| `featured` | 否 | boolean，預設 false |
| `lang` | 否 | `'en' \| 'zh-TW'`，預設 `'en'` |

從 schema 移除：`categories`、`author`、`hiddenInHomeList`。

`projects` schema：不動（基本欄位之外的 `technologies`、`status`、`project_url`、`featured`）。

### 內容變更

刪除：
- `src/content/posts/hello-world.md`
- `src/content/posts/getting-started-with-machine-learning.md`
- `src/content/posts/python-virtual-environments-quick-guide.md`
- `src/content/posts/top-programming-tools-workflow.md`
- `src/content/posts/building-hugo-blog-lessons-learned.md`
- `src/content/projects/ai-blog-assistant.md`
- `src/content/projects/edge-deployment-monitor.md`

保留，並從 frontmatter 拿掉 `categories` / `author`：
- `src/content/posts/rebuilding-my-site-as-an-agent.md`
- `src/content/posts/little-leo-workspace-to-system.md`（目前 untracked，要加進 git）

### CV 資料（`src/data/cv.ts`）

型別化的字面量，匯出 `education`、`experience`、`skills`。只放現站已經一致出現的事實：

- B.S. Electrical Engineering, National Taiwan University, Sep 2019 – Jun 2023
- M.S. Communication Engineering, National Taiwan University, Sep 2023 – present
- Organizer, NTUAIS (NTU AI Safety), 2024 – present
- Skills：直接沿用現在 `resume.astro` 的清單（languages / ai-ml / web / tools），由使用者刪減。

視為 placeholder 而刪除：「Tech Company Inc.」實習、假的 commit hash、`leonardo@…` / `leonardo@example.com`。

## 5. 路由、轉址、feed

`astro.config.mjs` 的 `redirects`：

```js
redirects: {
  '/about/': '/',
  '/resume/': '/cv/',
  '/posts/': '/writing/',
  '/posts/[...slug]/': '/writing/[...slug]/',
}
```

靜態輸出會為這些產生 meta-refresh 頁。`/tags/*` 變成 404。

Feed：`/rss.xml` 保留，item 連結指向 `/writing/<slug>/`。`/index.xml` Hugo 相容別名保留。Sitemap 由 `@astrojs/sitemap` 產生。

## 6. 元件

刪除：`AgentREPL.tsx`、`StreamItem.tsx`、`TopBar.astro`、`TerminalPanel.astro`、`ToolCall.astro`、`BelowCard.astro`、`TomlBlock.astro`、`ProjectCard.astro`、`GitLogRow.astro`。

新增（全部 `.astro`，零 JS）：
- `SiteHeader.astro` — 名字 + 導覽，接 `active`。
- `SiteFooter.astro` — 連結列。
- `PostList.astro` — 按年份分組的清單，接 posts 陣列。
- `ProjectEntry.astro` — 一個 project 區塊。
- `CvEntry.astro` — 一個 CV 條目。

`BaseLayout.astro` 繼續負責 `<head>`（title、description、OG image、canonical、RSS link、lang）並引入 `global.css`。
`src/lib/posts.ts` 保留 `getPublishedPosts`、`getPostStats`、`formatDate`；`getHomePosts` 隨 `hiddenInHomeList` 一起移除。

## 7. 測試

`tests/build.test.ts`（在 `beforeAll` 跑 `astro build`，用 cheerio 斷言）：
- 頁首正好有三個導覽連結，都帶尾斜線
- `/` 有四個區塊（intro、selected work、writing、contact）
- `/writing/` 按年份分組；數量等於非 draft 的來源檔數
- 每個文章頁有 `<h1>` 和 `<time>` 元素
- `/cv/` 渲染出種子的 education 條目
- `/about/`、`/resume/`、`/posts/` 存在 redirect 頁且指向新路徑
- `/rss.xml` 每篇已發布文章一個 `<item>`，連結指向 `/writing/`
- **所有建置出的 HTML 檔不含 `<script>` 標籤**

`tests/content.test.ts`：
- 每個 post 檔都能通過新 schema
- 沒有任何 post 檔含 `categories:` 或 `author:`

CI workflow 不動（已經先跑 `npm test` 再 `npm run build`）。

## 8. 清理

- `package.json`：移除 `react`、`react-dom`、`@types/react`、`@types/react-dom`、`@astrojs/react`、`@astrojs/mdx`。跑 `npm audit fix` 與 minor bump；維持 Astro 6.x。
- `tsconfig.json`：移除 `jsx` / `jsxImportSource`；拿掉 Hugo 時代的 `exclude` 項目（`themes`、`layouts`、`assets`、`resources`、`content`）。
- `README.md`、`CLAUDE.md`：依新結構重寫；移除不存在的 `src/content/pages/` 引用。
- `docs/specs/astro-migration*.md`：保留當歷史。

## 9. 使用者需提供的內容（不會以 TODO 形式出現在網站上）

- 聯絡 email
- 目前 M.S. 狀態／畢業時間，或現職
- 真實經歷條目（實習、研究職位）
- 代表作，以 `src/content/projects/*.md` 檔案提供
- Publications（如有，會成為 `/cv/` 的一節）

提供之前，對應區塊只渲染 §4 的種子資料。
