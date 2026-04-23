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

  it('home contains greeting heading', () => {
    const doc = $('dist/index.html');
    expect(doc('h1').text()).toMatch(/hello/i);
  });

  it('global stylesheet is emitted', () => {
    const doc = $('dist/index.html');
    const href = doc('link[rel="stylesheet"]').attr('href');
    expect(href, 'stylesheet link present').toBeTruthy();
  });
});

