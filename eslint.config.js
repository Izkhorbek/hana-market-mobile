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

  // ── React Compiler rules, added by eslint-config-expo 57 (react-hooks v6) ──
  // They fire on long-standing patterns in the animation / modal code: reading
  // `ref.current` during render, calling setState in an effect body, mutating
  // props or state in place. Each one needs a real refactor plus a device pass,
  // so they are warnings for now — the SDK 57 upgrade stays one change, and the
  // React Compiler adaptation is its own piece of work. Turn these back to
  // 'error' file by file as they get cleaned up.
  {
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/purity': 'warn',
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
