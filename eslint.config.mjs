import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['coverage', 'dist'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message: 'Import only inside shared auth, realtime, or storage facades.',
            },
            {
              name: '@sentry/react',
              message: 'Import only inside the shared telemetry facade.',
            },
            {
              name: 'axios',
              message: 'Import only inside the shared API facade.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/shared/auth/**/*.{ts,tsx}',
      'src/shared/realtime/**/*.{ts,tsx}',
      'src/shared/storage/**/*.{ts,tsx}',
      'src/shared/telemetry/**/*.{ts,tsx}',
      'src/shared/api/**/*.{ts,tsx}',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
)
