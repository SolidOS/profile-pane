module.exports = {
  // verbose: true, // Uncomment for detailed test output
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node'],
  },
  transform: {
    '^.+\\.(ts|js)$': ['babel-jest'],
  },
  setupFilesAfterEnv: ["./test/helpers/jest.setup.ts"],
  transformIgnorePatterns: [
    '/node_modules/(?!(lit-html|@solid-data-modules)/)'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  roots: ['<rootDir>/src', '<rootDir>/test', '<rootDir>/__mocks__'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/fileMock.js',
    '^[./a-zA-Z0-9$_-]+\\.ttl$': '<rootDir>/__mocks__/fileMock.js',
    '^SolidLogic$': 'solid-logic',
    '^\\$rdf$': 'rdflib'
  }
}