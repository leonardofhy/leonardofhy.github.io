# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hugo static blog using the PaperMod theme (git submodule), deployed to GitHub Pages via GitHub Actions. Site URL: `https://leonardofhy.github.io`.

## Commands

```bash
hugo server --buildDrafts    # Dev server with drafts at http://localhost:1313
hugo --minify                # Production build to public/
hugo new content/posts/post-name.md   # New post from archetype
git submodule update --init --recursive  # Initialize theme submodule
```

No test or lint commands. Hugo validates content during builds.

## Architecture

- **Configuration**: `hugo.toml` (TOML format). Uses `canonifyURLs = true` for GitHub Pages subpath compatibility.
- **Theme**: PaperMod as git submodule in `themes/PaperMod/`. Never edit theme files directly.
- **Custom homepage**: `layouts/_default/list.html` overrides PaperMod's default list template. When `site.IsHome` is true, it renders a custom hero + featured posts/projects + about + contact layout driven by `params.home` in `hugo.toml`. Non-home pages fall through to standard PaperMod behavior.
- **Homepage config**: `params.home` in `hugo.toml` controls the homepage hero text, identity chips, CTAs, focus areas, skills, featured counts, about blurb, and contact links.
- **Navigation**: `menu.main` in `hugo.toml` defines the top nav (Posts, Projects, About, Resume). `profileMode` is disabled.
- **Layout overrides**: `layouts/partials/extend_head.html` and `extend_footer.html` are PaperMod extension points (currently empty).
- **Content structure**:
  - `content/posts/` — blog posts as individual `.md` files
  - `content/projects/_index.md` — projects list page; individual projects as `.md` files in same directory
  - `content/about/index.md` — about page (page bundle)
  - `content/resume/index.md` — resume page (page bundle)
- **Static assets**: `static/images/`, referenced as `/images/filename.jpg` in markdown.
- **Deployment**: Push to `main` triggers `.github/workflows/deploy.yml` — Hugo Extended v0.155.1 builds and deploys to `gh-pages` branch. Cancels in-progress deploys.

## Content Conventions

Posts use YAML front matter:

```yaml
---
title: "Post Title"
date: 2025-01-20T14:55:00+08:00  # UTC+8 timezone
draft: false
tags: ["tag1", "tag2"]
categories: ["Category"]
author: "Leonardo Foo Haw Yang"
summary: "Brief description"
---
```

Projects use YAML front matter with optional `technologies`, `project_url`, and `featured: true` fields. Featured projects/posts appear on the homepage (controlled by `featuredPostCount`/`featuredProjectCount` in `params.home`).

## Key Constraints

- Hugo **Extended** is required (Sass compilation for PaperMod)
- `baseURL` is `https://leonardofhy.github.io/` (root path, no subpath)
- The archetype template (`archetypes/default.md`) uses TOML `+++` while all content uses YAML `---`
- `params.home.contactLinks` contains a placeholder email (`leonardo@example.com`) that needs to be updated
