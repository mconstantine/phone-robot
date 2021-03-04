module.exports = {
  extends: ['react-app', 'plugin:fp-ts/all'],
  plugins: ['fp-ts'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json']
  },
  rules: {
    // "array-callback-return": "off",
    'no-fallthrough': 'off',
    '@typescript-eslint/no-redeclare': 'off',
    // "@typescript-eslint/no-unused-vars": "off",
    // "react/jsx-pascal-case": "off",
    // "react/jsx-curly-brace-presence": "warn",
    'fp-ts/no-module-imports': [
      'error',
      {
        allowTypes: true,
        allowedModules: ['function', 'Apply']
      }
    ]
  }
}
