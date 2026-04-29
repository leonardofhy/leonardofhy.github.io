import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const sorted = await getPublishedPosts();
  return rss({
    title: "Leonardo Foo's Blog",
    description:
      "Leonardo Foo's personal blog about AI engineering, machine learning, and software development.",
    site: context.site ?? 'https://leonardofhy.github.io/',
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: `<language>en</language>`,
  });
}
