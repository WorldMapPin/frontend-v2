import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const files = [
  'app/**/*.{js,jsx,ts,tsx}',
  'components/**/*.{js,jsx,ts,tsx}',
  'lib/**/*.{js,jsx,ts,tsx}',
  'middleware.{js,jsx,ts,tsx}',
  'next.config.{js,mjs,cjs,ts,mts,cts}',
];

export default [
  {
    ignores: ['.next/**', 'next-env.d.ts', 'scripts/**'],
  },
  ...compat
    .config({
      extends: ['next/core-web-vitals', 'next/typescript'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    })
    .map((config) => ({
      ...config,
      files,
    })),
  {
    // Auth-flow files: forbid console.log to prevent leaking wallet
    // login results / OAuth tokens to the browser console (see F1).
    files: [
      'app/signup/**/*.{ts,tsx}',
      'app/hivesigner/**/*.{ts,tsx}',
      'components/AiohaProvider.tsx',
    ],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
