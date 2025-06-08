import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeSectionHeadings from './src/lib/rehypeHeadingSection';
import expressiveCode from 'astro-expressive-code';
import colors from 'tailwindcss/colors';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.rewired.moe',

  integrations: [
    sitemap(),
    svelte(),
    expressiveCode({
      themes: ['one-light'],
      styleOverrides: {
        borderWidth: '1px',
        borderColor: colors.stone[300],
        frames: {
          frameBoxShadowCssValue: 'none',
          inlineButtonBackground: colors.white,
          inlineButtonBorder: colors.stone[300],
          inlineButtonBorderOpacity: 1,
          inlineButtonForeground: colors.cyan[700],
          tooltipSuccessBackground: colors.white,
          tooltipSuccessForeground: colors.stone[500],
        },
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
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

  adapter: cloudflare({
    imageService: 'compile',
  }),
});
