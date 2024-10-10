module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transformIgnorePatterns: ["/node_modules/(?!lit-html).+\\.js"],
  testEnvironmentOptions: {
    customExportConditions: ['node']
  },
  moduleNameMapper: {
    '^[./a-zA-Z0-9$_-]+\\.ttl$': '<rootDir>/__mocks__/fileMock.js',    // '\\.ttl$'
  },

};
