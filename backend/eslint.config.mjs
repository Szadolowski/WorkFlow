// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Ignorujemy pliki konfiguracyjne i artefakty budowania
    ignores: ['eslint.config.mjs', 'dist/', 'node_modules/'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      // ZMIANA: NestJS/TypeScript to moduły, nie CommonJS
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Zgodnie z Twoim wyborem
      '@typescript-eslint/no-floating-promises': 'error', // Zmienione na error dla bezpieczeństwa
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // Naprawa błędu unsafe-call poprzez wymuszenie poprawnego sprawdzania typów
      '@typescript-eslint/no-unsafe-call': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
