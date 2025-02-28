/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'
import colors from 'tailwindcss/colors'

export default {
  safelist: [
    'motion-safe:animate-bounce',
    'invisible',
    'text-red-500',
  ],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    fontFamily: {
      sans: ["-apple-system", "system-ui", "Segoe UI", "Roboto", "Ubuntu", "Cantarell", "Noto Sans", "sans-serif", "BlinkMacSystemFont", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Arial"],
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            h1: {
              fontWeight: 400,
              fontSize: '26px'
            },
            h2: {
              fontSize: '22px'
            },
            h3: {
              fontSize: '18px'
            },
            'h2, h3, h4': {
              fontWeight: 400
            },
            pre: {
              backgroundColor: 'var(--tw-prose-pre-bg) !important'
            },
            code: {
              fontWeight: 400
            },
            'code::before': {
              content: 'none'
            },
            'code::after': {
              content: 'none'
            },
            'ol, ul': {
              marginTop: '0.25em',
              marginBottom: '0.25em',
              paddingInlineStart: '0.25em'
            },
            li: {
              marginTop: '0.25em',
              marginBottom: '0.25em'
            },
            p: {
              marginTop: '0.75em',
              marginBottom: '0.75em'
            },
            a: {
              fontWeight: 'light'
            },
            strong: {
              fontWeight: '500'
            },
            blockquote: {
              fontWeight: '400',
              fontStyle: 'normal'
            },
            'blockquote p:first-of-type::before': {
              content: 'none'
            },
            'blockquote p:last-of-type::after': {
              content: 'none'
            },
          }
        },
        stone: {
          css: {
            '--tw-prose-body': colors.stone[800],
            '--tw-prose-pre-bg': colors.stone[50],
            '--tw-prose-quote-borders': colors.cyan[500],
            '--tw-prose-bullets': colors.cyan[500],
            '--tw-prose-counters': colors.cyan[500],
            '--tw-prose-links': colors.cyan[700]
          }
        }
      }
    },
  },
}
