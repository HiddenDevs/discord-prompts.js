module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'max-len': 'off',
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
    'max-classes-per-file': [
      'error',
      2,
    ],
    'consistent-return': 'off',
    'class-methods-use-this': 'off',
    'linebreak-style': 'off',
    'no-console': 'error',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-unused-vars': 'off',
    'import/prefer-default-export': 'off',
  },
};
