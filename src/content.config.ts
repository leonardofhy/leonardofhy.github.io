import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
    lang: z.enum(['en', 'zh-TW']).optional().default('en'),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().optional().default(false),
    summary: z.string(),
    technologies: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
    status: z.enum(['shipped', 'archived', 'private', 'wip']).optional().default('shipped'),
    project_url: z.url().optional(),
  }),
});

export const collections = { posts, projects };
