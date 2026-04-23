import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function listMd(dir: string) {
  return readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
}

function readFrontmatter(path: string): Record<string, unknown> {
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`No frontmatter in ${path}`);
  const block = match[1];
  const obj: Record<string, unknown> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) obj[m[1]] = m[2].trim();
  }
  return obj;
}

describe('content source files', () => {
  it('has 5 posts in src/content/posts', () => {
    expect(listMd('src/content/posts')).toHaveLength(5);
  });

  it('has 2 projects in src/content/projects', () => {
    expect(listMd('src/content/projects')).toHaveLength(2);
  });

  it('has about + resume in src/content/pages', () => {
    const files = listMd('src/content/pages');
    expect(files).toContain('about.md');
    expect(files).toContain('resume.md');
  });

  it('every post has title, date, summary', () => {
    for (const f of listMd('src/content/posts')) {
      const fm = readFrontmatter(join('src/content/posts', f));
      expect(fm.title, `${f} missing title`).toBeTruthy();
      expect(fm.date, `${f} missing date`).toBeTruthy();
      expect(fm.summary, `${f} missing summary`).toBeTruthy();
    }
  });

  it('every project has title, date, summary', () => {
    for (const f of listMd('src/content/projects')) {
      const fm = readFrontmatter(join('src/content/projects', f));
      expect(fm.title, `${f} missing title`).toBeTruthy();
      expect(fm.date, `${f} missing date`).toBeTruthy();
      expect(fm.summary, `${f} missing summary`).toBeTruthy();
    }
  });
});
