import { describe, it, expect } from 'vitest';
import { readingMinutes, formatDate, yearOf } from '../src/lib/text';

describe('readingMinutes', () => {
  it('never returns less than 1', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('three short words')).toBe(1);
  });

  it('counts latin words at 220 wpm', () => {
    const body = Array(660).fill('word').join(' ');
    expect(readingMinutes(body)).toBe(3);
  });

  it('counts CJK characters at 400 cpm instead of whitespace-splitting', () => {
    const body = '中'.repeat(2000);
    expect(readingMinutes(body)).toBe(5);
  });

  it('adds mixed latin and CJK', () => {
    const body = '中'.repeat(800) + ' ' + Array(440).fill('word').join(' ');
    expect(readingMinutes(body)).toBe(4);
  });
});

describe('formatDate / yearOf', () => {
  it('formats in Asia/Taipei as YYYY-MM-DD', () => {
    expect(formatDate(new Date('2026-04-23T19:30:00+08:00'))).toBe('2026-04-23');
  });

  it('groups a post published just after midnight Taipei under the Taipei year', () => {
    expect(yearOf(new Date('2026-01-01T00:30:00+08:00'))).toBe('2026');
  });
});
