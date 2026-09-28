/**
 * Native React Native lane for the primitives (`*.test.tsx`).
 *
 * This package's primitives only touch core `react-native` components
 * (View, Pressable, Text, TextInput, Image, Modal, ActivityIndicator,
 * StyleSheet) — no Expo or native-module APIs — so the plain `react-native`
 * Jest preset is enough; no jest-expo/Expo toolchain is needed here.
 */
module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/__rnw__/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?))',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
