import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import ts from 'typescript-eslint'
import { eslintConfigForEnv } from './tools/eslint-plugin/helpers.js'
import tr from './tools/eslint-plugin/index.js'

const CI = process.env.CI
const VSCODE = process.env.VSCODE_CWD

export default ts.config(
  eslint.configs.recommended,
  ...ts.configs.stylisticTypeChecked,
  ...ts.configs.strictTypeChecked,
  prettier,
  {
    ignores: [
      'node_modules/**',
      'scripts/**',
      'tools/**',
      '**/*.config.{js,ts}',
      '**/*.spec.ts',
      '**/*.test.ts',
      'build.js',
      'src/lib/assets/**',
      '!src/lib/config.ts',
      'src/lib/lang/**',
      'src/test/__mocks__/**',
    ],
  },
  {
    plugins: { tr },
    rules: {
      'tr/tr': process.env.I18N ? 'error' : 'off',
      'tr/export-boundaries': 'error',
    },
  },
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      'no-empty': 'off',
      'no-console': 'off',
      'no-undef': 'off',
      'prefer-const': 'warn',
      'lines-between-class-members': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/prefer-return-this-type': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/class-literal-property-style': 'off',
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'default',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: ['objectLiteralMethod', 'objectLiteralProperty'],
          format: null,
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: ['enumMember'],
          format: ['PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],
    },
  },
  {
    files: ['src/lib/extensions/**'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  eslintConfigForEnv(process.env.PROGRESS || (!CI && !VSCODE), {
    plugins: {
      'file-progress': (await import('eslint-plugin-file-progress')).default,
    },
    rules: {
      'file-progress/activate': 'warn',
    },
  }),

  eslintConfigForEnv(!CI, {
    plugins: {
      'only-warn': (await import('eslint-plugin-only-warn')).default,
    },
  }),
)
