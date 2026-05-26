import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // HMR boundary rule — only matters for dev fast-refresh ergonomics,
      // not production correctness. Some files intentionally export helpers
      // alongside components (renderMarkdownish, ContactReview, etc.).
      'react-refresh/only-export-components': 'off',
      // React Compiler memoization preservation — only relevant if we
      // explicitly opt into the compiler. Refs accessed inside useCallback
      // bodies trigger this; the existing memoization is intentional.
      'react-hooks/preserve-manual-memoization': 'off',
      // Keep dep warnings useful but non-blocking
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
])
