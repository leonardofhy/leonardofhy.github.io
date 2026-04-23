import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', (p) => p.data.draft !== true);
  const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
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
