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
