/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2020',
          module: 'commonjs',
          esModuleInterop: true,
          strict: true,
          types: ['node', 'jest'],
        },
      },
    ],
  },
  globalSetup: '<rootDir>/tests/integration/setup.ts',
  globalTeardown: '<rootDir>/tests/integration/teardown.ts',
  runInBand: true,
  testTimeout: 30000,
};
