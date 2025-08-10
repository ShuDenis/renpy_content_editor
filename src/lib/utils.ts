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
import type { SceneProject, Hotspot } from "@lib/sceneSchema"

export function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function projectToCanvasScalar(proj: SceneProject, value: number, canvasSize: number, refSize: number): number {
  return proj.project.coords_mode === "relative" ? value * canvasSize : value * (canvasSize / refSize)
}

export function canvasToProjectScalar(proj: SceneProject, value: number, canvasSize: number, refSize: number): number {
  const v = proj.project.coords_mode === "relative" ? value / canvasSize : value / (canvasSize / refSize)
  return round3(v)
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

export function convertProjectCoordsMode(proj: SceneProject, mode: 'relative' | 'absolute'): SceneProject {
  if (proj.project.coords_mode === mode) return proj
  const refW = proj.project.reference_resolution.width
  const refH = proj.project.reference_resolution.height
  const scenes = proj.scenes.map(scene => ({
    ...scene,
    hotspots: scene.hotspots?.map(hs => convertHotspot(hs)) ?? []
  }))
  return { ...proj, project: { ...proj.project, coords_mode: mode }, scenes }

  function convertHotspot(hs: Hotspot): Hotspot {
    if (hs.shape === 'rect' && hs.rect) {
      const { x, y, w, h } = hs.rect
      return {
        ...hs,
        rect: {
          x: mode === 'relative' ? round3(x / refW) : round3(x * refW),
          y: mode === 'relative' ? round3(y / refH) : round3(y * refH),
          w: mode === 'relative' ? round3(w / refW) : round3(w * refW),
          h: mode === 'relative' ? round3(h / refH) : round3(h * refH),
        }
      }
    } else if (hs.shape === 'circle' && hs.circle) {
      const { cx, cy, r } = hs.circle
      return {
        ...hs,
        circle: {
          cx: mode === 'relative' ? round3(cx / refW) : round3(cx * refW),
          cy: mode === 'relative' ? round3(cy / refH) : round3(cy * refH),
          r: mode === 'relative' ? round3(r / refW) : round3(r * refW),
        }
      }
    } else if (hs.shape === 'polygon' && hs.points) {
      const pts = hs.points.map(([px, py]) => [
        mode === 'relative' ? round3(px / refW) : round3(px * refW),
        mode === 'relative' ? round3(py / refH) : round3(py * refH)
      ]) as typeof hs.points
      return { ...hs, points: pts }
    }
    return hs
  }
}
