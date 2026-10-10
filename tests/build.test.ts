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
