/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native-quick-base64$': '<rootDir>/tests/mocks/react-native-quick-base64.mock.ts',
    '^expo-haptics$': '<rootDir>/tests/mocks/expo-haptics.mock.ts',
  },
  testMatch: ['**/tests/**/*.test.ts'],
};
