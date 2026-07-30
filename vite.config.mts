import { solidPane, buildConfig } from "solidos-toolkit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: solidPane({
    litDecoratorPaths: ["src/components"],
    sandbox: {
      subject: "https://chase.pivot-test.solidproject.org:3000/profile/card#me",
    },
  }),

  build: buildConfig({
    entry: "src/index.ts",
  }),
  test: {
    environment: "jsdom",
    setupFiles: ["test/setup.ts"],
    coverage: {
      include: ["src/**/*.[jt]s"],
    },
  },
});
