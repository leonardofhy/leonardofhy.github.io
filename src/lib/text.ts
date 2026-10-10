const WORDS_PER_MINUTE = 220;
const CJK_CHARS_PER_MINUTE = 400;
const SITE_TZ = 'Asia/Taipei';
const CJK = /[㐀-鿿豈-﫿]/g;

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** YYYY-MM-DD in Asia/Taipei. */
export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

/** Four-digit year in Asia/Taipei, for grouping lists. */
export function yearOf(d: Date): string {
  return formatDate(d).slice(0, 4);
}

/** Reading time: CJK characters at 400/min plus latin words at 220/min, minimum 1. */
export function readingMinutes(body: string): number {
  const cjk = (body.match(CJK) ?? []).length;
  const latinWords = body.replace(CJK, ' ').trim().split(/\s+/).filter(Boolean).length;
  const minutes = cjk / CJK_CHARS_PER_MINUTE + latinWords / WORDS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}
