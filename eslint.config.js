// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from 'eslint/config'
import expoConfig from 'eslint-config-expo/flat.js'

export default defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      semi: ['error', 'never'],
    },
  },

  // ── Node-side files (build config, config plugins, CLI scripts) ────────────
  // These run in Node/CommonJS, never in the app bundle, so declare its globals.
  {
    files: ['*.config.js', 'plugins/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
      },
    },
  },

  // ── Architecture boundary enforcement (see ARCHITECTURE.md §1, §9) ──────────
  // Turns the Dependency Rule into a build error. Needs the TS path resolver so
  // that `@/...` alias imports resolve to real files before zone matching.
  {
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: './tsconfig.json' },
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Presentation (app, components) must not touch the Data layer directly.
            {
              target: './app',
              from: './api/services',
              message:
                'UI must reach api/services only through a hook (api/hooks). See ARCHITECTURE.md §1.',
            },
            {
              target: './components',
              from: './api/services',
              message:
                'UI must reach api/services only through a hook (api/hooks). See ARCHITECTURE.md §1.',
            },
            // Data layer must never import upward.
            {
              target: './api/services',
              from: './app',
              message:
                'Data layer must not import Presentation. Dependencies point downward. See ARCHITECTURE.md §1.',
            },
            {
              target: './api/services',
              from: './components',
              message:
                'Data layer must not import Presentation. Dependencies point downward. See ARCHITECTURE.md §1.',
            },
            {
              target: './api/services',
              from: './modules',
              message:
                'Data layer must not import feature stores. Dependencies point downward. See ARCHITECTURE.md §1.',
            },
            {
              target: './api/services',
              from: './api/hooks',
              message:
                'Data layer must not import the hooks (Application) layer. Dependencies point downward. See ARCHITECTURE.md §1.',
            },
          ],
        },
      ],
    },
  },
])
