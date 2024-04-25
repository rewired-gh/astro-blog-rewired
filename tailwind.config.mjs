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
              fontWeight: 400,
              color: colors.rose[800]
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
            'ul > li::marker': {
              color: colors.rose[200],
            },
            p: {
              marginTop: '0.75em',
              marginBottom: '0.75em'
            },
            a: {
              fontWeight: 'light',
              color: colors.rose[800]
            },
            strong: {
              fontWeight: '400'
            }
          }
        },
        stone: {
          css: {
            '--tw-prose-pre-bg': colors.stone[50],
          }
        }
      }
    },
  },
  plugins: [
    typography
  ],
}
