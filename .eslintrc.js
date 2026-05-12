// https://docs.expo.dev/guides/using-eslint/
const path = require('path');

module.exports = {
  root: true,
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  // eslint-config-expo's TS override sets import/resolver to `node` only, which breaks
  // resolution for packages that use package.json "exports" (e.g. @react-navigation/native).
  // This override runs after Expo's and restores the TypeScript resolver.
  overrides: [
    {
      files: ['*.{ts,tsx}'],
      settings: {
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
            project: path.join(__dirname, 'tsconfig.json'),
          },
          node: {
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
          },
        },
      },
    },
  ],
};
