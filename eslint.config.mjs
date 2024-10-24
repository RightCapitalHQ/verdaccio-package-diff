import eslintConfigRightcapital from '@rightcapital/eslint-config';

const { config } = eslintConfigRightcapital.utils;

export default config(
  {
    ignores: ['dist'],
  },
  ...eslintConfigRightcapital.configs.recommended,
);
