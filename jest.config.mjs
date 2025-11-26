export default {
  // verbose: true, // Uncomment for detailed test output
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node'],
  },
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.mjs' }],
  },
  setupFilesAfterEnv: ["./test/helpers/jest.setup.ts"],
  transformIgnorePatterns: ["/node_modules/(?!lit-html).+\\.js"],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  moduleNameMapper: {
    '^[./a-zA-Z0-9$_-]+\\.ttl$': '<rootDir>/__mocks__/fileMock.js',    // '\\.ttl$'
  },
  roots: ['<rootDir>/src', '<rootDir>/test', '<rootDir>/__mocks__'],
  moduleNameMapper: {
    '^SolidLogic$': 'solid-logic',
    '^\\$rdf$': 'rdflib'
  }
}

