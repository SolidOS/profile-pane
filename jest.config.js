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
  transformIgnorePatterns: ['/node_modules/(?!lit-html|lit|@lit|@uvdsl/solid-oidc-client-browser|uuid|@noble|solid-logic|solid-ui)'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  roots: ['<rootDir>/src', '<rootDir>/test', '<rootDir>/__mocks__'],
  moduleNameMapper: {
    '\\.(png|jpe?g|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.module\\.css$': 'identity-obj-proxy',
    '\\.css$': '<rootDir>/__mocks__/fileMock.js',
    '^SolidLogic$': 'solid-logic',
    '^\\$rdf$': 'rdflib'
  }
}