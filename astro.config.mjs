import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSectionHeadings from './src/lib/rehypeHeadingSection';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.rewired.moe',
  integrations: [sitemap(), svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noreferrer'],
        },
      ],
      rehypeSectionHeadings,
    ],
  },
});
