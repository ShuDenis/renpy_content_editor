export function loadFileAsText(accept = "*"): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        input.remove()
        return resolve(null)
      }
      const reader = new FileReader()
      reader.onload = () => {
        resolve(String(reader.result))
        input.remove()
      }
      reader.readAsText(file)
    }
    input.click()
  })
}

export function saveTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// coordinate helpers
import type { SceneProject } from "@lib/sceneSchema"

export function projectToCanvasScalar(proj: SceneProject, value: number, canvasSize: number, refSize: number): number {
  return proj.project.coords_mode === "relative" ? value * canvasSize : value * (canvasSize / refSize)
}

export function canvasToProjectScalar(proj: SceneProject, value: number, canvasSize: number, refSize: number): number {
  return proj.project.coords_mode === "relative" ? value / canvasSize : value / (canvasSize / refSize)
}

export function projectToCanvasPoint(proj: SceneProject, x: number, y: number, canvasW: number, canvasH: number) {
  const refW = proj.project.reference_resolution.width
  const refH = proj.project.reference_resolution.height
  return {
    x: projectToCanvasScalar(proj, x, canvasW, refW),
    y: projectToCanvasScalar(proj, y, canvasH, refH)
  }
}

export function canvasToProjectPoint(proj: SceneProject, x: number, y: number, canvasW: number, canvasH: number) {
  const refW = proj.project.reference_resolution.width
  const refH = proj.project.reference_resolution.height
  return {
    x: canvasToProjectScalar(proj, x, canvasW, refW),
    y: canvasToProjectScalar(proj, y, canvasH, refH)
  }
}
