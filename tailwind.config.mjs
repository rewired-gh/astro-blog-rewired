/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'
import colors from 'tailwindcss/colors'

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            h1: {
              fontWeight: 300,
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
              fontWeight: '400'
            },
            blockquote: {
              fontWeight: '300',
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
  plugins: [
    typography
  ],
}
