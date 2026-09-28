/**
 * react-native-web compatibility lane — see src/__rnw__/primitives.rnw.test.tsx.
 * Aliases `react-native` to `react-native-web` and renders under jsdom with
 * the DOM testing-library, instead of the native preset in jest.config.cjs.
 */
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/__rnw__/**/*.test.tsx'],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['module:@react-native/babel-preset'] }],
  },
};
