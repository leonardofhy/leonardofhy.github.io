import { getCollection, type CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

const WORDS_PER_MINUTE = 220;
const SITE_TZ = 'Asia/Taipei';

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: SITE_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

export function formatTime(d: Date): string {
  return timeFmt.format(d);
}

function bodyOf(post: Post): string {
  return (post as unknown as { body?: string }).body ?? '';
}

export interface PostStats {
  body: string;
  words: number;
  lines: number;
  readMin: number;
  dateStr: string;
  fileName: string;
  frontmatterText: string;
}

export function getPostStats(post: Post): PostStats {
  const body = bodyOf(post);
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const lines = body.split('\n').length;
  const readMin = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  const dateStr = formatDate(post.data.date);
  const fileName = `${post.id}.md`;
  const frontmatterText = `---
file:     ${fileName}
date:     ${dateStr}
tags:     ${JSON.stringify(post.data.tags ?? [])}
read:     ${readMin} min
lines:    ${lines}
---`;
  return { body, words, lines, readMin, dateStr, fileName, frontmatterText };
}

function byDateDesc(a: Post, b: Post): number {
  return b.data.date.getTime() - a.data.date.getTime();
}

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', (p) => p.data.draft !== true);
  return posts.sort(byDateDesc);
}

export async function getHomePosts(): Promise<Post[]> {
  const posts = await getCollection(
    'posts',
    (p) => p.data.draft !== true && !p.data.hiddenInHomeList,
  );
  return posts.sort(byDateDesc);
}

export function tagToSlug(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '-');
}
