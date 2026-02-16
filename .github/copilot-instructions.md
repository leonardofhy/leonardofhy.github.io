# GitHub Copilot Instructions for Leonardo's Blog

## Overview

This is a Hugo-based personal blog using the PaperMod theme, deployed automatically to GitHub Pages. The site focuses on AI and technology content with bilingual support (English/Chinese).

## Architecture & Key Components

### Hugo Structure

- **Content**: All posts go in `content/posts/` as Markdown files
- **Theme**: Uses PaperMod theme as a git submodule in `themes/PaperMod/`
- **Configuration**: Site settings in `hugo.toml` (not `config.yaml`)
- **Layouts**: Custom overrides in `layouts/partials/` (currently just `google_analytics.html`)

### Content Creation Workflow

```bash
# Create new post (preferred method)
hugo new content/posts/post-name.md

# Development server with drafts
hugo server --buildDrafts

# Production build
hugo --minify
```

### Front Matter Convention

Posts use YAML front matter with these required fields:

```yaml
---
title: "Post Title"
date: 2025-01-20T14:55:00+08:00 # ISO format with timezone
draft: false # Must be false to publish
tags: ["tag1", "tag2"] # Array format
categories: ["Category"] # Array format
author: "Leonardo Foo" # Consistent author name
summary: "Brief description" # Used in listings
---
```

## Deployment & CI/CD

### Automatic Deployment

- **Trigger**: Push to `main` branch only
- **Workflow**: `.github/workflows/deploy.yml`
- **Build**: Uses Hugo Extended with `--minify`
- **Target**: Deploys to `gh-pages` branch → GitHub Pages
- **URL**: `https://leonardofhy.github.io`
- **Recommended branch flow**: Develop on `dev`, then merge `dev -> main` to trigger deployment.

### Critical Dependencies

- Hugo Extended version required (not standard Hugo)
- Git submodules must be updated: `git submodule update --init --recursive`
- Theme updates: `cd themes/PaperMod && git pull`

## Project-Specific Patterns

### Bilingual Content

- Existing content includes Chinese characters
- No formal i18n structure - relies on individual post language
- Keep `languageCode = 'en'` in config for default behavior

### Theme Customization

- Minimal customization approach - avoid heavy theme modifications
- Custom partials in `layouts/partials/` override theme defaults
- Google Analytics placeholder exists but unused

### File Organization

```
content/posts/           # All blog posts
archetypes/default.md    # Post template (uses +++ TOML format)
static/                  # Images and static assets
layouts/partials/        # Theme overrides
hugo.toml               # Main configuration
```

## Development Workflow

### Local Development

```bash
# Clone with theme submodule
git clone --recurse-submodules <repo>

# Start dev server (includes drafts)
hugo server --buildDrafts

# Access at http://localhost:1313
```

Branch workflow:
- `dev`: development branch for daily work and feature integration
- `main`: production branch; push here will trigger deployment automatically

### Content Guidelines

- Images: Place in `static/images/`, reference as `/images/filename.jpg`
- Drafts: Set `draft: true` in front matter during writing
- SEO: Always include meaningful `summary` field
- Consistency: Use "Leonardo Foo" as author, maintain tag/category consistency

## Common Issues & Solutions

### Build Failures

- Ensure Hugo Extended is installed (`brew install hugo`)
- Check front matter YAML syntax (common cause of build failures)
- Verify git submodules are initialized

### Theme Issues

- Theme is a git submodule - don't edit directly in `themes/PaperMod/`
- Create overrides in `layouts/` instead
- Update theme: `git submodule update --remote themes/PaperMod`

## Integration Points

- **GitHub Actions**: Fully automated deployment pipeline
- **GitHub Pages**: Hosting target (`gh-pages` branch)
- **PaperMod Theme**: External dependency via git submodule
- **Hugo Extended**: Build dependency for theme compatibility
