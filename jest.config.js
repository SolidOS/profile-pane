
module.exports = {

  globals: {
       "ts-jest": {
          tsConfigFile: "tsconfig.json"
        },
        TextEncoder: require("util").TextEncoder,
        TextDecoder: require("util").TextDecoder
    },

  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transformIgnorePatterns: ["/node_modules/(?!lit-html).+\\.js"],

  // @@ tim's attempts
  verbose: true,
  silent: false,

  // testEnvironmentOptions: {
  //   html: '<!DOCTYPE html><div id="app"></div></html>',
  // },



};
