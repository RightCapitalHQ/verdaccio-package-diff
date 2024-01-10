/** @type {import("eslint").Linter.Config} */
module.exports = {
  // use overrides to group different types of files
  // see https://eslint.org/docs/latest/use/configure/configuration-files#configuration-based-on-glob-patterns
  overrides: [
    {
      files: ['src/**/*.ts'],
      excludedFiles: ['src/**/*.test.ts'], // exclude test files
      extends: ['@rightcapital/typescript'],
      env: { node: true },
    },
  ],
};
