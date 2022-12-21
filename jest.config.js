module.exports = {

  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transformIgnorePatterns: ["/node_modules/(?!lit-html).+\\.js"],

  // @@ tim's attempts
  verbose: true,

  testEnvironmentOptions: {
    html: '<!DOCTYPE html><div id="app"></div></html>',
  },



};
