export default {
  // verbose: true, // Uncomment for detailed test output
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'jsdom',
   testEnvironmentOptions: {
    customExportConditions: ['node'],
  },
  setupFilesAfterEnv: ["./test/helpers/jest.setup.ts"],
  transformIgnorePatterns: ["/node_modules/(?!lit-html).+\\.js"],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  moduleNameMapper: {
    '^[./a-zA-Z0-9$_-]+\\.ttl$': '<rootDir>/__mocks__/fileMock.js',    // '\\.ttl$'
    // Mock CSS modules
    '\\.module\\.css$': 'identity-obj-proxy',
    // Mock other style files (optional)
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy'
  },
  roots: ['<rootDir>/src', '<rootDir>/test', '<rootDir>/__mocks__'],
}

