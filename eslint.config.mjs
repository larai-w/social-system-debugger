// ESLint flat config。
// 方針: 本アプリは「バンドラなし・古典スクリプトで全 js がグローバル共有」という
//   意図的な設計。よって no-undef / no-unused-vars は無効（大量の誤検知になるため。
//   関数解決は tests/invariants.test.mjs が別途担保）。
//   ここでは「実際のバグ」（重複キー・到達不能・条件式の代入ミス等）だけを拾う。
import js from '@eslint/js';

export default [
  { ignores: ['node_modules/**', 'infra/**', 'web/js/**/*.min.js', 'cdk.out/**'] },

  // ブラウザ側アプリコード（web/js/*.js） — 古典スクリプト・グローバル共有
  {
    files: ['web/js/**/*.js', 'web/config.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        FileReader: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        Event: 'readonly',
        Image: 'readonly',
        Chart: 'readonly',
        Capacitor: 'readonly',
        prompt: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
      },
    },
    rules: {
      // グローバル共有設計のため誤検知になるものは無効化（invariant テストが別途担保）
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-cond-assign': ['error', 'except-parens'],
      'no-constant-binary-expression': 'off',
      'no-useless-escape': 'off',
      'no-control-regex': 'off',
      'no-prototype-builtins': 'off',
      'no-fallthrough': 'off',
    },
  },

  // Node 側スクリプト・テスト（ESM）
  {
    files: ['tests/**/*.mjs', 'scripts/**/*.mjs'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly', Buffer: 'readonly' },
    },
    rules: { 'no-unused-vars': 'off' },
  },
];
