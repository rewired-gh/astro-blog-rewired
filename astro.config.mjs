import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      }
    },
    remarkPlugins: [
      remarkMath
    ]
  }
});