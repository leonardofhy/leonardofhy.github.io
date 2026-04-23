import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import * as cheerio from 'cheerio';

const run = (cmd: string) => execSync(cmd, { stdio: 'pipe' }).toString();

beforeAll(() => {
  run('npx astro build --silent');
}, 120_000);

function $(path: string) {
  return cheerio.load(readFileSync(path, 'utf8'));
}

describe('build', () => {
  it('produces dist/index.html', () => {
    expect(existsSync('dist/index.html')).toBe(true);
  });

  it('global stylesheet is emitted', () => {
    const doc = $('dist/index.html');
    const href = doc('link[rel="stylesheet"]').attr('href');
    expect(href, 'stylesheet link present').toBeTruthy();
  });
});

describe('posts list', () => {
  it('renders a terminal panel with tail -f title', () => {
    const doc = $('dist/posts/index.html');
    expect(doc('.v6-panel-top-l span').text()).toContain('tail -f');
  });

  it('renders one StreamItem per post source file', () => {
    const doc = $('dist/posts/index.html');
    expect(doc('.v6-stream-item').length).toBe(5);
  });

  it('topbar marks writing active', () => {
    const doc = $('dist/posts/index.html');
    expect(doc('.v6-topnav a.active').text().trim()).toBe('writing');
  });
});

describe('post detail', () => {
  const slug = 'building-hugo-blog-lessons-learned';
  it('renders title, frontmatter card, and body', () => {
    const doc = $(`dist/posts/${slug}/index.html`);
    expect(doc('.v6-post-head h1').text()).toBe('Building a Hugo Blog: Lessons Learned');
    expect(doc('.v6-fm-pre').text()).toContain('title:');
    expect(doc('.v6-post-body').length).toBe(1);
  });

  it('renders an ask-about-this-post footer', () => {
    const doc = $(`dist/posts/${slug}/index.html`);
    expect(doc('.v6-ask').length).toBe(1);
  });

  it('renders prev/next nav', () => {
    const doc = $(`dist/posts/${slug}/index.html`);
    expect(doc('.v6-post-nav').length).toBe(1);
  });
});

describe('projects list', () => {
  it('renders a card per project', () => {
    const doc = $('dist/projects/index.html');
    expect(doc('.v6-proj-card').length).toBe(2);
  });

  it('featured project shows the star flag', () => {
    const doc = $('dist/projects/index.html');
    expect(doc('.v6-proj-card.featured .flag').length).toBeGreaterThan(0);
  });

  it('build log section exists', () => {
    const doc = $('dist/projects/index.html');
    expect(doc('.v6-buildlog').length).toBe(1);
  });
});

describe('project detail', () => {
  const slug = 'ai-blog-assistant';
  it('renders manifest + body', () => {
    const doc = $(`dist/projects/${slug}/index.html`);
    expect(doc('.v6-post-head h1').text()).toBe('AI Blog Assistant');
    expect(doc('.v6-fm-pre').text()).toContain('stack:');
    expect(doc('.v6-post-body').length).toBe(1);
  });
});

describe('home page (V6 Agent)', () => {
  it('renders V6 top bar with agent link active', () => {
    const doc = $('dist/index.html');
    expect(doc('.v6-topbar').length).toBe(1);
    expect(doc('.v6-topnav a.active').text().trim()).toBe('agent');
  });

  it('renders the terminal panel with the session title', () => {
    const doc = $('dist/index.html');
    expect(doc('.v6-panel').length).toBe(1);
    expect(doc('.v6-panel-top-l span').text()).toContain('session · ask-leonardo');
  });

  it('renders the welcome card + seed conversation', () => {
    const doc = $('dist/index.html');
    expect(doc('.v6-welcome-title').text()).toContain("Hi, I'm");
    expect(doc('.v6-msg-system').length).toBeGreaterThan(0);
    expect(doc('.v6-msg-user-text').length).toBeGreaterThan(0);
    expect(doc('.v6-msg-assistant').length).toBeGreaterThan(0);
  });

  it('renders quick-command chips as anchors', () => {
    const doc = $('dist/index.html');
    const chips = doc('.v6-quick-chip');
    expect(chips.length).toBe(4);
    expect(chips.toArray().every((el) => el.name === 'a')).toBe(true);
  });

  it('renders three highlight cards below the panel', () => {
    const doc = $('dist/index.html');
    expect(doc('.v6-below-card').length).toBe(3);
  });
});

