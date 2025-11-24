export default {
  // verbose: true, // Uncomment for detailed test output
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node'],
  },
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.mjs' }]
  },
  transformIgnorePatterns: [],
  extensionsToTreatAsEsm: ['.ts'],
    setupFilesAfterEnv: ['<rootDir>/test/helpers/jest.setup.ts'],

    testPathIgnorePatterns: ['/node_modules/', '/lib/'],
    moduleNameMapper: {
      '^[./a-zA-Z0-9$_-]+\\.ttl$': '<rootDir>/__mocks__/fileMock.js',
      '\\.module\\.css$': 'identity-obj-proxy',
      '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
    },
    roots: ['<rootDir>/src', '<rootDir>/test', '<rootDir>/__mocks__']
}

