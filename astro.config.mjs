import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import remarkMath from 'remark-math';

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.rewired.moe',
  integrations: [tailwind(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      }
    },
    remarkPlugins: [remarkMath]
  }
});