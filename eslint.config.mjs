// @ts-check

import eslintPluginAstro from 'eslint-plugin-astro'
import tseslint from 'typescript-eslint';

export default [
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs['flat/recommended'],
  {
    ignores: ['public/', 'dist/', '.astro/'],
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.astro',
    ],
    rules: {
    },
  },
]
