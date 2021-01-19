module.exports = {
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transformIgnorePatterns: ["/node_modules/(?!lit-html).+\\.js"],
};
