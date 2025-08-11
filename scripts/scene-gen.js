import fs from 'fs/promises'
import path from 'path'
import { validateSceneProject } from '../packages/core/sceneSchema.js'

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.error('Usage: scene-gen <input.json> [outputDir]')
    process.exit(1)
  }
  const [inputPath, outDir = '_gen'] = args
  const json = await fs.readFile(inputPath, 'utf8')
  const data = JSON.parse(json)
  const project = validateSceneProject(data)

  const outPath = path.resolve(outDir)
  await fs.rm(outPath, { recursive: true, force: true })
  await fs.mkdir(outPath, { recursive: true })

  for (const scene of project.scenes) {
    const lines = []
    lines.push(`# Auto-generated file. Do not edit.`)
    lines.push(`screen scene_${scene.id}():`)
    lines.push('    zorder 10')
    for (const layer of scene.layers) {
      if (layer.type === 'image') {
        lines.push(`    add "${layer.image}"`)
      } else if (layer.type === 'color') {
        lines.push(`    add Solid("${layer.color}") alpha ${layer.alpha}`)
      }
    }
    lines.push('')
    lines.push(`label show_${scene.id}:`)
    lines.push(`    show screen scene_${scene.id}`)
    lines.push('    return')

    const fileName = path.join(outPath, `scene_${scene.id}.rpy`)
    await fs.writeFile(fileName, lines.join('\n'), 'utf8')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
