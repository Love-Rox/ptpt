import { defineConfig } from 'vite-plus'

// Root Vite+ config: lint (Oxlint) and format (Oxfmt) for the whole monorepo.
// Per-package build/test still use their own vite.config.ts / vitest.config.ts.
export default defineConfig({
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 100,
  },
  lint: {
    ignorePatterns: ['**/dist/**', 'reference/**', 'docs/**'],
  },
})
