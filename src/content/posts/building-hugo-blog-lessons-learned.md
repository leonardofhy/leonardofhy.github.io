---
title: "Building a Hugo Blog: Lessons Learned"
date: 2025-08-05T16:30:00+08:00
draft: false
tags: ["hugo", "blogging", "web-development", "github-pages"]
categories: ["Web Development"]
author: "胡皓雍 (Leonardo Foo Haw Yang)"
summary: "My experience setting up this Hugo blog with the PaperMod theme, including challenges faced, solutions found, and tips for other developers."
---

## Why Hugo?

When I decided to create a personal blog, I had several options: WordPress, Ghost, Jekyll, or Hugo. After researching and comparing, I chose Hugo for several compelling reasons:

- **Speed**: Hugo is incredibly fast at building static sites
- **Simplicity**: No database required, just markdown files
- **Flexibility**: Powerful templating and customization options
- **GitHub Integration**: Easy deployment with GitHub Pages

## Choosing the Right Theme

The Hugo ecosystem has hundreds of themes, but I settled on [PaperMod](https://github.com/adityatelange/hugo-PaperMod) because:

- Clean, minimal design that focuses on content
- Excellent mobile responsiveness
- Built-in dark/light mode toggle
- SEO optimized out of the box
- Active community and regular updates

## Setup Process

### Initial Setup

```bash
# Install Hugo (macOS)
brew install hugo

# Create new site
hugo new site my-blog
cd my-blog

# Add theme as git submodule
git submodule add https://github.com/adityatelange/hugo-PaperMod themes/PaperMod
```

### Configuration Highlights

The most important configuration in `hugo.toml`:

```toml
baseURL = 'https://leonardofhy.github.io/'
title = "Leonardo's Blog"
theme = "PaperMod"

[params]
  defaultTheme = "auto"
  
  [params.profileMode]
    enabled = true
    title = "Leonardo Foo"
    subtitle = "AI Engineer & Technology Enthusiast"
```

## Challenges and Solutions

### Challenge 1: Git Submodules

**Problem**: Theme wasn't loading properly after cloning
**Solution**: Always clone with submodules:
```bash
git clone --recurse-submodules https://github.com/leonardofhy/leonardofhy.github.io.git
```

### Challenge 2: Deployment Configuration

**Problem**: GitHub Pages deployment was failing
**Solution**: Ensure the workflow uses Hugo Extended:
```yaml
- name: Setup Hugo
  uses: peaceiris/actions-hugo@v3
  with:
    hugo-version: 'latest'
    extended: true  # This is crucial!
```

### Challenge 3: Content Organization

**Problem**: How to structure different types of content
**Solution**: Created separate pages for different purposes:
- `/posts/` for blog articles
- `/resume` for professional information
- `/projects` for showcasing work
- `/about` for personal information

## Development Workflow

My typical workflow for creating new content:

```bash
# Create new post
hugo new content/posts/my-new-post.md

# Start development server
hugo server --buildDrafts

# Edit content in your favorite editor
# Save and see live reload in browser

# When ready to publish
git add .
git commit -m "Add new post about [topic]"
git push origin main
```

## Performance Optimizations

- **Image optimization**: Keep images under 1MB
- **Minification**: Use `hugo --minify` for production builds
- **CDN**: GitHub Pages provides global CDN automatically

## SEO Considerations

- Always include meaningful `summary` in front matter
- Use descriptive titles and proper heading hierarchy
- Add relevant tags and categories
- Enable social media meta tags in theme

## Lessons Learned

1. **Start simple**: Don't over-customize initially, focus on content
2. **Version control everything**: Including theme as submodule is crucial
3. **Test locally**: Always preview changes before pushing
4. **Consistent naming**: Establish conventions for tags, categories, and file names
5. **Backup strategy**: Git serves as backup, but consider additional strategies

## What's Next?

- Add search functionality
- Implement comment system (maybe using GitHub Discussions)
- Create custom shortcodes for enhanced content
- Add analytics to understand readership

## Resources That Helped

- [Hugo Documentation](https://gohugo.io/documentation/)
- [PaperMod Theme Documentation](https://github.com/adityatelange/hugo-PaperMod/wiki)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- Hugo community forums and Discord

## Final Thoughts

Hugo has been an excellent choice for my blog. The learning curve was gentle, and the development experience is smooth. The combination of Hugo + PaperMod + GitHub Pages provides a powerful, free, and maintainable blogging platform.

If you're considering starting a technical blog, I highly recommend this stack. The time invested in learning Hugo pays off quickly in development speed and site performance.

---

*Have questions about Hugo or this setup? Feel free to reach out or check the [repository](https://github.com/leonardofhy/leonardofhy.github.io) for the full configuration.*
