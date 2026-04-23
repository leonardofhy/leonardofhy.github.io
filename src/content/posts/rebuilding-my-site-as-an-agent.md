---
title: "Rebuilding My Site as an Agent (and Moving It to Astro)"
date: 2026-04-23T17:00:00+08:00
draft: false
tags: ["astro", "hugo", "design", "ai"]
categories: ["Web Development"]
author: "胡皓雍 (Leonardo Foo Haw Yang)"
summary: "Why my personal site now looks like a Claude Code terminal — and why, after shipping that design on Hugo, I moved the whole stack to Astro + React in the same fortnight."
featured: true
---

I rebuilt this site twice in two weeks. First as a "Claude Code terminal" UI on top of Hugo, then — once the design was settled — off Hugo entirely and onto Astro. Both rebuilds happened for the same reason, and I want to write the reason down while the motivation is still fresh.

## Why rewrite it at all

The previous version was Hugo + PaperMod. It worked. Nothing was broken. But two things had been bothering me for a while:

1. **The site didn't signal who I am.** I spend most of my working hours around AI agents — writing code with Claude Code, thinking about safe deployment, running evaluations at NTUAIS. A default PaperMod blog could have belonged to anyone; it felt generic in a way that didn't fit.
2. **Hugo was getting in the way.** I live in TypeScript and React day to day, and Go templates are a context-switch every time I touch layout. Worse, LLMs handle Go templating worse than they handle JSX, so the AI-assisted editing loop was lower signal than it could be.

Either reason alone wouldn't have been enough. Together they tipped me over.

## Arriving at the design

Instead of browsing more PaperMod forks, I used Claude Design to mock up options. I handed it my `content/` folder, asked for a "technical / researcher" aesthetic, and got five variations back:

- **V1 · Index** — stark catalog, numbered sections
- **V2 · Dossier** — 12-column grid with stat cards
- **V3 · Journal** — editorial broadsheet
- **V4 · Terminal** — retro green-on-black CLI
- **V5 · Field Notes** — asymmetric editorial with oversized italics

None of them were wrong. They were just all directions other people's sites already live in. So I asked: *could you try a Claude Code terminal style?* — warm instead of retro-green, soft rounded panel, tool-call chips, a model/context/cwd status line. That came back as **V6 · Agent**, and I knew within thirty seconds that was the one.

V6 wasn't just an aesthetic choice. The design came with an idea: **the site runs as an agent**. The homepage isn't a hero block followed by a list of posts — it's a chat session. You ask it something, it replies with tool calls and a markdown answer. Type `/projects` and it embeds a project card grid inline.

## Per-section metaphors

Once V6 was the direction, each sub-page got its own metaphor:

- **Writing** is `$ tail -f content/posts/`. Posts stream in newest-first. Each entry collapses to show its frontmatter like a tool result.
- **Post detail** is `$ read_file <slug>.md`. Serif title, a frontmatter code block up top, an "ask about this post" input at the bottom (disabled, for now).
- **Projects** is `$ cat ~/leonardo/projects.json | jq .`. Each project is an object card with stack, status pill, featured flag. A build-log section mimics a CI feed.
- **About** is `$ cat ~/.config/leonardo.toml`. Identity, what_i_do, off_the_clock, availability — as TOML `[section]` blocks with `key = "value"` rows.
- **Resume** is `$ git log --oneline --graph --all ~/career`. Each life milestone is a commit, color-coded by `feat` / `perf` / `merge` / `init`.

It's a silly premise on paper — a personal site presenting itself as a fake Claude Code session — and it landed exactly because of that.

## Shipping V6 on Hugo first

I did the first pass on Hugo. Evenings for about a week: custom `layouts/*.html`, a `partials/header.html` override so the V6 top bar replaced PaperMod's, dark-only theme, IBM Plex Mono + Instrument Serif, and the whole V6 design ported by hand from the original React JSX into Go templates.

It looked right. But every time I opened an `.html` file in that repo I regretted the choice. Go templating ate the component model — the `v6-panel` chrome appeared six times across layouts because there was no JSX-like slot I trusted to reuse. The agent REPL on the homepage was a static mock that a visitor couldn't actually talk to, and there was no clean path to wiring Claude into it without grafting a separate SPA onto the side.

I merged the V6 Hugo version to `main`, lived with it for a couple of days, and then started the migration.

## Hugo → Astro

I surveyed honestly before committing. Candidates: Next.js, Remix/React Router v7, SvelteKit, Eleventy, TanStack Start, Astro. Three different LLMs converged on **Astro with the React integration** as the right shape:

- Content-first, like Hugo — markdown files in a directory, typed collections with Zod schemas, RSS/sitemap official plugins.
- Drops existing React components in as *islands* without asking me to rewrite them.
- Stays static on GitHub Pages until the day I need SSR. When I want the real Claude REPL, one config flag (`output: 'server'`) plus an adapter gets me a streaming endpoint. Not a rewrite.

The migration landed as a branch with one atomic commit per phase: scaffold → content collections → port V6 components from the original design bundle → rebuild each page → RSS + 404 + tag archives → swap the GitHub Actions workflow → delete the Hugo tree. Each phase had to pass `astro check` plus a small integration suite (vitest + cheerio asserting the built HTML) before the next phase began.

### What I gained

- A real component model. `TerminalPanel` is *one* file now, used by every page that has a terminal card.
- Type-safe frontmatter. Zod catches a missing `summary` at build time, not in review.
- React islands where I need state (the collapsible post stream, the agent REPL mock), zero JS everywhere else.
- An escape hatch. The moment I want the REPL talking to a real model, it's a single PR — flip the output mode, add an adapter, write the route handler.

### What I lost

- Hugo's speed. Astro builds ~30 pages in a second; Hugo did it in under 50ms. This matters to me exactly zero.
- Probably one RSS subscriber had to re-subscribe because `@astrojs/rss` emits slightly different XML element ordering. `/index.xml` is still served as a compatibility alias.

## What's next

The agent REPL on the homepage is still a visual mock — the input is disabled, the send button greyed out. That's deliberate: v1 shipped as a static site. The next PR wires it to a streaming Anthropic endpoint and makes the `ask leonardo anything…` prompt do what it suggests.

The final Hugo state is preserved as a git tag called `hugo-v6-final`. If some part of this experiment ages badly I can always revert back to being generic.

The broader lesson, to the extent there is one: **you can rebuild a small personal site twice in two weeks if you have the right tools and you stop treating the first rebuild as a commitment.** The Hugo V6 version wasn't wasted work — it pinned down the design, which was the hard part. Once the design was real, picking the implementation stack was the easy part, and swapping implementations once you know what you're building is much cheaper than thinking-before-building promised.
