# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hugo static blog using the PaperMod theme (git submodule), deployed to GitHub Pages via GitHub Actions. Configuration is in `hugo.toml` (TOML format).

## Commands

```bash
# Development server (includes draft posts)
hugo server --buildDrafts

# Production build
hugo --minify

# Create a new post
hugo new content/posts/post-name.md

# Initialize/update theme submodule
git submodule update --init --recursive
```

There are no test or lint commands. Hugo validates content during builds.

## Architecture

- **Content**: Markdown files in `content/`. Posts go in `content/posts/` as individual `.md` files. Section pages use `content/<section>/index.md` (about, resume) or `content/<section>/_index.md` (projects).
- **Theme**: PaperMod loaded as a git submodule in `themes/PaperMod/`. Never edit theme files directly.
- **Layout overrides**: `layouts/partials/` can override theme partials. `extend_head.html` and `extend_footer.html` are PaperMod's extension points (currently empty).
- **Static assets**: Images go in `static/images/`, referenced as `/images/filename.jpg` in markdown.
- **Deployment**: Push to `main` triggers `.github/workflows/deploy.yml` which builds with Hugo Extended v0.155.1 and deploys to `gh-pages` branch. Site URL: `https://leonardofhy.github.io/leonardo_blog`.

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

## Key Constraints

- Hugo **Extended** version is required (Sass compilation for PaperMod theme)
- `baseURL` includes the `/leonardo_blog` subpath; `canonifyURLs = true` is set for GitHub Pages compatibility
- The archetype template (`archetypes/default.md`) uses TOML format (`+++`) while posts use YAML (`---`)
- About and Resume pages contain agent-generated placeholder content that needs to be replaced with real information
