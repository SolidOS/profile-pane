import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { optimize } from 'svgo'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageRoot = path.resolve(__dirname, '..')

const iconsSourceDir = path.join(packageRoot, 'src', 'icons')
const logosSourceDir = path.join(packageRoot, 'src', 'logos')
const distIconsDir = path.join(packageRoot, 'dist', 'icons')
const distLogosDir = path.join(packageRoot, 'dist', 'logos')

const { default: iconsSvgoConfig } = await import(path.join(packageRoot, 'svgo.icons.config.mjs'))
const { default: logosSvgoConfig } = await import(path.join(packageRoot, 'svgo.logos.config.mjs'))

async function optimizeFolder(sourceDir, outDir, config) {
  await mkdir(outDir, { recursive: true })
  const entries = await readdir(sourceDir, { withFileTypes: true })

  await Promise.all(
    entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.svg'))
      .map(async entry => {
        const inputPath = path.join(sourceDir, entry.name)
        const outputPath = path.join(outDir, entry.name)
        const rawSvg = await readFile(inputPath, 'utf-8')
        const optimized = optimize(rawSvg, {
          path: inputPath,
          ...config
        })
        await writeFile(outputPath, optimized.data, 'utf-8')
      })
  )
}

await rm(path.join(packageRoot, 'dist'), { recursive: true, force: true })
await optimizeFolder(iconsSourceDir, distIconsDir, iconsSvgoConfig)
await optimizeFolder(logosSourceDir, distLogosDir, logosSvgoConfig)

console.log('icons: built dist/icons and dist/logos')
