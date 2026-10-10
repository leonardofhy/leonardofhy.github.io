// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://leonardofhy.github.io/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
  redirects: {
    '/about': '/',
    '/resume': '/cv/',
    '/posts': '/writing/',
    '/posts/[...slug]': '/writing/[...slug]',
  },
});
