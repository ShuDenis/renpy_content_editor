#!/usr/bin/env node

import { readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"

import { validateDialogProject } from "../core/dialogSchema.js"
import { validateSceneProject } from "../core/sceneSchema.js"

function main() {
  const inputPath = process.argv[2]
  if (!inputPath) {
    console.error("Usage: node cli/generate.mjs <input.json>")
    process.exit(1)
  }

  const raw = readFileSync(inputPath, "utf-8")
  const data = JSON.parse(raw)

  let kind = ""
  let project

  if ("dialogs" in data) {
    project = validateDialogProject(data)
    kind = "dialog"
  } else if ("scenes" in data) {
    project = validateSceneProject(data)
    kind = "scene"
  } else {
    console.error("Input does not match known schemas")
    process.exit(1)
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const outDir = path.resolve(__dirname, "../_gen")
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true, force: true })
  }
  mkdirSync(outDir, { recursive: true })

  if (kind === "dialog") {
    const text = generateDialogRpy(project)
    writeFileSync(path.join(outDir, "dialogs.rpy"), text, "utf-8")
  } else {
    const text = generateSceneRpy(project)
    writeFileSync(path.join(outDir, "scenes.rpy"), text, "utf-8")
  }
}

function generateDialogRpy(project) {
  const lines = ["# Generated dialogs"]
  for (const dlg of project.dialogs) {
    lines.push(`label ${dlg.id}:`)
    for (const node of dlg.nodes) {
      if (node.text) {
        const speaker = node.speaker ? `${node.speaker} ` : ""
        lines.push(`    ${speaker}"${node.text}"`)
      }
      if (node.choices && node.choices.length > 0) {
        lines.push("    menu:")
        for (const choice of node.choices) {
          lines.push(`        "${choice.text}":`)
          if (choice.next) {
            lines.push(`            jump ${choice.next}`)
          }
        }
      }
    }
    lines.push("")
  }
  return lines.join("\n")
}

function generateSceneRpy(project) {
  const lines = ["# Generated scenes"]
  for (const scene of project.scenes) {
    lines.push(`label ${scene.id}:`)
    for (const layer of scene.layers) {
      if (layer.type === "image") {
        lines.push(`    show ${layer.image}`)
      } else if (layer.type === "color") {
        lines.push(`    show layer ${layer.id} Solid(${layer.color})`)
      }
    }
    lines.push("    return")
    lines.push("")
  }
  return lines.join("\n")
}

main()

