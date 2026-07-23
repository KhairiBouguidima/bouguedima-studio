import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const feedsDir = join(process.cwd(), 'public', 'assets', 'feeds')
const manifestPath = join(feedsDir, 'manifest.json')
const imagePattern = /\.(avif|gif|jpe?g|png|webp)$/i

let files = []

try {
  files = await readdir(feedsDir)
} catch {
  files = []
}

const images = files
  .filter((file) => imagePattern.test(file))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((file) => `/assets/feeds/${file}`)

await writeFile(manifestPath, `${JSON.stringify(images, null, 2)}\n`)
