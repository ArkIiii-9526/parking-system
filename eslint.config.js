import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import js from '@eslint/js';

export default [
  {
    ignores: ['node_modules/**', 'dist/**']
  },
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      },
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'vue/multi-word-component-names': ['error', {
        ignores: ['index', '404']
      }],
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }]
    }
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential']
];