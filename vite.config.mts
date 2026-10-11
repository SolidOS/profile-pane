import type { PluginOption } from "vite"
import { solidPane, buildConfig } from "solidos-toolkit/vite"
import { defineConfig } from "vitest/config"

// `vite build --watch` reruns each plugin bundle hook on every change.
// Strip the dts plugin and CJS output in watch mode so the inner loop stays
// to a single ESM wave and does not trigger downstream rebuild churn.
const isWatch = process.argv.includes("--watch")

const build = buildConfig({ entry: 'src/index.ts' })
if (isWatch && build && Array.isArray(build.rolldownOptions?.output)) {
  build.rolldownOptions.output = build.rolldownOptions.output.filter(
    (o: { format?: string }) => o.format === "es",
  )
}

type ConcretePlugin = Extract<PluginOption, { name: string }>

const flattenPlugins = async (input: unknown): Promise<ConcretePlugin[]> => {
  if (!input) return []
  const resolved = await input
  if (!resolved) return []
  if (Array.isArray(resolved)) {
    const nested = await Promise.all(resolved.map(flattenPlugins))
    return nested.flat()
  }
  return [resolved as ConcretePlugin]
}

const plugins = (await flattenPlugins(
  solidPane({
    litDecoratorPaths: ["src/components"],
    sandbox: {
      subject: "https://testingsolidos.solidcommunity.net/profile/card#me",
    },
  }),
)).filter((p) => !(isWatch && /dts/i.test(p.name)))

export default defineConfig({
  build,
  plugins,
  test: {
    environment: "jsdom",
    setupFiles: ["test/setup.ts"],
    coverage: {
      include: ["src/**/*.[jt]s"],
    },
  },
})
