import { solidPane, buildConfig } from "solidos-toolkit/vite";
import { defineConfig } from "vitest/config";
import Icons from "unplugin-icons/vite";

const plugins = solidPane({
  litDecoratorPaths: ["src/components"],
  sandbox: {
    subject: "https://testingsolidos.solidcommunity.net/profile/card#me",
  },
});
const build = buildConfig({ entry: "src/index.ts" });

export default defineConfig({
  plugins: [
    Icons({
      compiler: "web-components",
      autoInstall: true,
      webComponents: {
        autoDefine: false,
        iconPrefix: "icon",
      },
    }),
    ...plugins,
  ],

  build,
  test: {
    environment: "jsdom",
    setupFiles: ["test/setup.ts"],
    coverage: {
      include: ["src/**/*.[jt]s"],
    },
  },
});
