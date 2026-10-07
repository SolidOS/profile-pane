import { solidPane, buildConfig } from "solidos-toolkit/vite";
import { defineConfig } from "vitest/config";
import type { PluginOption } from "vite";

const isWatch = process.argv.includes("--watch");
type ConcretePlugin = Extract<PluginOption, { name: string }>;
async function watchPlugins(input: PluginOption): Promise<ConcretePlugin[]> {
  const resolved = await input;
  if (!resolved) return [];
  if (Array.isArray(resolved)) {
    return (await Promise.all(resolved.map(watchPlugins))).flat();
  }
  return /dts/i.test(resolved.name) ? [] : [resolved];
}
const plugins = solidPane({
  litDecoratorPaths: ["src/components"],
  sandbox: {
    subject: "https://testingsolidos.solidcommunity.net/profile/card#me",
  },
});
const build = buildConfig({ entry: "src/index.ts" });
if (isWatch && build && Array.isArray(build.rolldownOptions?.output)) {
  build.rolldownOptions.output = build.rolldownOptions.output.filter(
    (output: { format?: string }) => output.format === "es",
  );
  build.emptyOutDir = false;
  build.watch = { exclude: ["**/dist/**"] };
}

export default defineConfig({
  plugins: isWatch ? await watchPlugins(plugins) : plugins,

  build,
  test: {
    environment: "jsdom",
    setupFiles: ["test/setup.ts"],
    coverage: {
      include: ["src/**/*.[jt]s"],
    },
  },
});
