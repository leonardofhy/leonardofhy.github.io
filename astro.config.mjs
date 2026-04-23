// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://leonardofhy.github.io/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [react(), mdx(), sitemap()],
});
