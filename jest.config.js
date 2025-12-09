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
  transformIgnorePatterns: ["/node_modules/(?!lit-html).+\\.js"],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  moduleNameMapper: {
    '^[./a-zA-Z0-9$_-]+\\.css$': '<rootDir>/__mocks__/fileMock.js',
    '^[./a-zA-Z0-9$_-]+\\.ttl$': '<rootDir>/__mocks__/fileMock.js',
    '^SolidLogic$': 'solid-logic',
    '^\\$rdf$': 'rdflib'
  },
  roots: ['<rootDir>/src', '<rootDir>/test', '<rootDir>/__mocks__'],
}