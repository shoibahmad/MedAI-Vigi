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
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // eslint-plugin-react is not installed, so jsx-uses-vars is unavailable and
      // identifiers referenced only inside JSX read as unused. Ignoring the
      // PascalCase convention covers components, including destructured `icon: Icon`
      // render props.
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' },
      ],
    },
  },
  {
    // Vendored shadcn/ui primitives: they pair a component with its cva variants in
    // one file by design. Not our code to restructure.
    files: ['src/components/ui/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Provider + its companion hook in one file is the intended React pattern.
    files: ['src/context/**/*.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['*.config.js', 'vite.config.js'],
    languageOptions: { globals: globals.node },
  },
])
