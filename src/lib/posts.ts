import { getCollection, type CollectionEntry } from 'astro:content';
import { formatDate, readingMinutes } from './text';

type Post = CollectionEntry<'posts'>;

export interface PostStats {
  words: number;
  readMin: number;
  dateStr: string;
}

function bodyOf(post: Post): string {
  return (post as unknown as { body?: string }).body ?? '';
}

export function getPostStats(post: Post): PostStats {
  const body = bodyOf(post);
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return {
    words,
    readMin: readingMinutes(body),
    dateStr: formatDate(post.data.date),
  };
}

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', (p) => p.data.draft !== true);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
