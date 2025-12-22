import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // ✅ separate tests folder
  testMatch: ['<rootDir>/tests/**/*.test.(ts|tsx)'],

  // jest-dom matchers
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setupTests.ts'],

  // CSS imports in React components
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/helpers/styleMock.ts',
  },

  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
};

export default config;
