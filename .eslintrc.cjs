module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules', '.pnpm-store'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': 'off', // Allow any for bpmn-js integration
    'no-unused-vars': 'off', // Turn off base rule as it can report incorrect errors
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}
