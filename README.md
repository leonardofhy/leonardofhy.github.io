# Leonardo's Notes

A personal blog built with [Hugo](https://gohugo.io/) and hosted on GitHub Pages, featuring notes and thoughts on AI and technology topics.

## 🌐 Site Access

The blog is live at: **https://leonardofhy.github.io**

> **Note**: If you experience redirects to an inaccessible domain, please use the direct GitHub Pages URL above. The repository owner may need to update the custom domain settings in the GitHub Pages configuration.

The site is automatically deployed via GitHub Actions whenever changes are pushed to the `main` branch.

## 🛠️ Local Development Setup

### Prerequisites

1. **Install Hugo Extended** (required for this theme):
   
   **macOS:**
   ```bash
   brew install hugo
   ```
   
   **Linux/WSL:**
   ```bash
   # Download the latest extended version
   # Visit https://github.com/gohugoio/hugo/releases to find the latest version.
   # Replace <VERSION> with the latest version number (e.g., 0.124.1)
   wget https://github.com/gohugoio/hugo/releases/download/v<VERSION>/hugo_extended_<VERSION>_linux-amd64.tar.gz
   tar -xzf hugo_extended_<VERSION>_linux-amd64.tar.gz
   sudo mv hugo /usr/local/bin/
   ```
   
   **Windows:**
   ```bash
   choco install hugo-extended
   ```

2. **Clone the repository** (with submodules for the theme):
   ```bash
   git clone --recurse-submodules https://github.com/leonardofhy/leonardofhy.github.io.git
   cd leonardofhy.github.io
   ```

### Running Locally

Start the development server:
```bash
hugo server --buildDrafts
```

The site will be available at `http://localhost:1313` with live reload enabled.

## ✍️ Creating New Content

### Create a New Blog Post

1. **Using Hugo's archetype system**:
   ```bash
   hugo new content/posts/my-new-post.md
   ```

2. **Manual creation** - Create a new `.md` file in `content/posts/` with this front matter:
   ```yaml
   ---
   title: "Your Post Title"
   date: 2025-01-20T14:55:00+08:00
   draft: false
   tags: ["tag1", "tag2"]
   categories: ["Category"]
   author: "Leonardo Foo"
   summary: "Brief description of your post"
   ---
   
   Your content goes here...
   ```

### Front Matter Fields

- `title`: Post title
- `date`: Publication date (ISO format)
- `draft`: Set to `false` to publish, `true` to keep as draft
- `tags`: Array of tags for categorization
- `categories`: Array of categories
- `author`: Author name
- `summary`: Brief description (shown in post listings)

### Writing Content

- Use standard Markdown syntax
- Place images in `static/images/` and reference them as `/images/filename.jpg`
- Posts support Hugo's shortcodes for enhanced functionality

## 🚀 Publishing Content

### Automatic Deployment

Changes are automatically deployed when you:

1. **Commit and push** to the `main` branch:
   ```bash
   git add .
   git commit -m "Add new post about [topic]"
   git push origin main
   ```

2. **GitHub Actions** will automatically:
   - Build the Hugo site
   - Deploy to GitHub Pages
   - Make it live at the site URL

### Manual Build (Optional)

To build the site locally:
```bash
hugo --minify
```

This creates a `public/` directory with the static site files.

## 📁 Project Structure

```
leonardofhy.github.io/
├── archetypes/          # Content templates
│   └── default.md       # Default post template
├── content/             # Site content
│   └── posts/           # Blog posts
├── layouts/             # Custom layout overrides
├── static/              # Static files (images, etc.)
├── themes/              # Hugo themes
│   └── PaperMod/        # Current theme (git submodule)
├── hugo.toml            # Site configuration
└── README.md            # This file
```

## ⚙️ Configuration

Site settings are configured in `hugo.toml`:

- **baseURL**: Site URL for deployment
- **title**: Site title shown in browser
- **theme**: Hugo theme being used
- **params**: Theme-specific settings and social links

## 🎨 Theme

This site uses the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme, which provides:

- Clean, minimal design
- Dark/light mode toggle
- Mobile responsive layout
- Fast loading times
- SEO optimized

## 📝 Tips for Content Creation

1. **Preview drafts**: Use `hugo server --buildDrafts` to see draft posts
2. **Organize content**: Use categories and tags consistently
3. **SEO friendly**: Write descriptive summaries and titles
4. **Images**: Keep images optimized for web (< 1MB recommended)
5. **Markdown**: Use proper heading hierarchy (H2, H3, etc.)

## 🔧 Troubleshooting

**Theme not loading?**
```bash
git submodule update --init --recursive
```

**Build fails?**
- Ensure you're using Hugo Extended version
- Check for syntax errors in front matter
- Verify all required fields are present

**Local server not accessible?**
```bash
hugo server --bind 0.0.0.0 --baseURL http://localhost:1313
```

### Site redirects to inaccessible domain?
If the site redirects to a non-working custom domain:
1. Go to your repository's **Settings** → **Pages**
2. Under "Custom domain", remove any custom domain if it's not working
3. Ensure "Source" is set to "Deploy from a branch" with branch `gh-pages`
4. Wait a few minutes for changes to take effect