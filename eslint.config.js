import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...astro.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.astro/**',
      'public/**',
      'apps/**',
      'azure-functions/**',
      'scripts/**',
      '*.config.*',
      'assets/**',
      'data-exports/**',
      'infrastructure/**',
      'shared/**',
      'tests/**',
      '**/partnerships/guidelines.astro', // Parser issue with complex nested HTML
      '**/map.astro', // Parser issue with complex TypeScript in script tags
      '**/privacy.astro', // Parser issue with complex nested HTML
      'workers/**', // Separate Cloudflare Worker project
      'carl-mcp/src/vendor/**', // Verbatim copy of the retrieval contract; must stay byte-identical
      'carl-mcp/node_modules/**',
      'carl-mcp/http/node_modules/**',
    ],
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['**/*.astro', '**/*.astro/*.js', '**/*.astro/*.ts'],
    rules: {
      'no-unused-vars': 'off', // Astro frontmatter has complex scoping
      'no-empty': 'off',
      'no-undef': 'off', // TypeScript and Astro handle this
    },
  },
];
