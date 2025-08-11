import { Hotspot, SceneProject } from "@core/sceneSchema"
import type { Point } from "@core/sceneSchema"
import { projectToCanvasPoint, projectToCanvasScalar, canvasToProjectPoint, canvasToProjectScalar } from "@core/utils"

export type HitResult =
  | { kind: "move" }
  | { kind: "vertex"; index: number }
  | { kind: "add"; index: number }
  | { kind: "radius" }

const HANDLE = 6

export function drawHotspot(ctx: CanvasRenderingContext2D, proj: SceneProject, hs: Hotspot, W: number, H: number) {
  ctx.save()
  ctx.translate(0.5,0.5)
  ctx.lineWidth = 1
  ctx.strokeStyle = "#333"
  ctx.fillStyle = "rgba(0,0,0,0.06)"
  if (hs.shape === "rect" && hs.rect) {
    const refW = proj.project.reference_resolution.width
    const refH = proj.project.reference_resolution.height
    const x = projectToCanvasScalar(proj, hs.rect.x, W, refW)
    const y = projectToCanvasScalar(proj, hs.rect.y, H, refH)
    const w = projectToCanvasScalar(proj, hs.rect.w, W, refW)
    const h = projectToCanvasScalar(proj, hs.rect.h, H, refH)
    ctx.fillRect(x, y, w, h)
    ctx.strokeRect(x, y, w, h)
  } else if (hs.shape === "polygon" && hs.points) {
    const pts = hs.points.map(p => projectToCanvasPoint(proj, p[0], p[1], W, H))
    if (pts.length) {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // vertex handles
      for (const pt of pts) {
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, HANDLE, 0, Math.PI*2)
        ctx.fillStyle = "#fff"
        ctx.fill()
        ctx.stroke()
      }
      // edge handles for adding
      for (let i=0;i<pts.length;i++) {
        const a = pts[i], b = pts[(i+1)%pts.length]
        const mx = (a.x+b.x)/2, my = (a.y+b.y)/2
        ctx.beginPath()
        ctx.rect(mx-HANDLE/2, my-HANDLE/2, HANDLE, HANDLE)
        ctx.fillStyle = "#fff"
        ctx.fill()
        ctx.stroke()
      }
    }
  } else if (hs.shape === "circle" && hs.circle) {
    const refW = proj.project.reference_resolution.width
    const refH = proj.project.reference_resolution.height
    const cx = projectToCanvasScalar(proj, hs.circle.cx, W, refW)
    const cy = projectToCanvasScalar(proj, hs.circle.cy, H, refH)
    const r = projectToCanvasScalar(proj, hs.circle.r, W, refW)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI*2)
    ctx.fill()
    ctx.stroke()
    // radius handle
    ctx.beginPath()
    ctx.arc(cx + r, cy, HANDLE, 0, Math.PI*2)
    ctx.fillStyle = "#fff"
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

function distance(x: number, y: number, x2: number, y2: number) {
  const dx = x - x2, dy = y - y2
  return Math.sqrt(dx*dx + dy*dy)
}

export function hitTestHotspot(proj: SceneProject, hs: Hotspot, W: number, H: number, x: number, y: number): HitResult | null {
  if (hs.shape === "rect" && hs.rect) {
    const refW = proj.project.reference_resolution.width
    const refH = proj.project.reference_resolution.height
    const rx = projectToCanvasScalar(proj, hs.rect.x, W, refW)
    const ry = projectToCanvasScalar(proj, hs.rect.y, H, refH)
    const rw = projectToCanvasScalar(proj, hs.rect.w, W, refW)
    const rh = projectToCanvasScalar(proj, hs.rect.h, H, refH)
    if (x>=rx && x<=rx+rw && y>=ry && y<=ry+rh) return { kind:"move" }
  } else if (hs.shape === "polygon" && hs.points) {
    const pts = hs.points.map(p => projectToCanvasPoint(proj, p[0], p[1], W, H))
    for (let i=0;i<pts.length;i++) {
      const pt = pts[i]
      if (distance(x,y,pt.x,pt.y) <= HANDLE) return { kind:"vertex", index:i }
    }
    for (let i=0;i<pts.length;i++) {
      const a = pts[i], b = pts[(i+1)%pts.length]
      const mx = (a.x+b.x)/2, my = (a.y+b.y)/2
      if (distance(x,y,mx,my) <= HANDLE) return { kind:"add", index:i }
    }
    if (pointInPolygon(x,y,pts)) return { kind:"move" }
  } else if (hs.shape === "circle" && hs.circle) {
    const refW = proj.project.reference_resolution.width
    const refH = proj.project.reference_resolution.height
    const cx = projectToCanvasScalar(proj, hs.circle.cx, W, refW)
    const cy = projectToCanvasScalar(proj, hs.circle.cy, H, refH)
    const r = projectToCanvasScalar(proj, hs.circle.r, W, refW)
    if (distance(x,y,cx+r,cy) <= HANDLE) return { kind:"radius" }
    if (distance(x,y,cx,cy) <= r) return { kind:"move" }
  }
  return null
}

function pointInPolygon(x: number, y: number, pts: {x:number,y:number}[]) {
  let inside = false
  for (let i=0,j=pts.length-1;i<pts.length;j=i++) {
    const xi=pts[i].x, yi=pts[i].y
    const xj=pts[j].x, yj=pts[j].y
    const intersect = ((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)
    if (intersect) inside = !inside
  }
  return inside
}

export function translateHotspot(hs: Hotspot, proj: SceneProject, dx: number, dy: number, W: number, H: number) {
  const refW = proj.project.reference_resolution.width
  const refH = proj.project.reference_resolution.height
  const dpx = canvasToProjectScalar(proj, dx, W, refW)
  const dpy = canvasToProjectScalar(proj, dy, H, refH)
  if (hs.shape === "rect" && hs.rect) {
    hs.rect.x += dpx
    hs.rect.y += dpy
  } else if (hs.shape === "polygon" && hs.points) {
    hs.points = hs.points.map(p => [p[0]+dpx, p[1]+dpy]) as Point[]
  } else if (hs.shape === "circle" && hs.circle) {
    hs.circle.cx += dpx
    hs.circle.cy += dpy
  }
}

export function moveVertexTo(hs: Hotspot, proj: SceneProject, index: number, x: number, y: number, W: number, H: number) {
  if (hs.shape !== "polygon" || !hs.points) return
  const pt = canvasToProjectPoint(proj, x, y, W, H)
  hs.points[index] = [pt.x, pt.y]
}

export function setCircleRadius(hs: Hotspot, proj: SceneProject, x: number, y: number, W: number, H: number) {
  if (hs.shape !== "circle" || !hs.circle) return
  const refW = proj.project.reference_resolution.width
  const refH = proj.project.reference_resolution.height
  const cx = projectToCanvasScalar(proj, hs.circle.cx, W, refW)
  const cy = projectToCanvasScalar(proj, hs.circle.cy, H, refH)
  const rCanvas = distance(x, y, cx, cy)
  const rProj = canvasToProjectScalar(proj, rCanvas, W, refW)
  hs.circle.r = rProj
}

export function insertVertex(hs: Hotspot, proj: SceneProject, index: number, x: number, y: number, W: number, H: number) {
  if (hs.shape !== "polygon" || !hs.points) return
  const pt = canvasToProjectPoint(proj, x, y, W, H)
  hs.points.splice(index+1, 0, [pt.x, pt.y])
}
