module.exports = {
  env: {
    browser: false,
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "single", {"allowTemplateLiterals": true}],
    "max-len": ["error", {"code": 120}],
    "object-curly-spacing": ["error", "always"],
    "comma-dangle": ["error", "never"],
    "indent": ["error", 4]
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};