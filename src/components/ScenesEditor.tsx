import React, { useEffect, useMemo, useRef, useState } from "react"
import { SceneProject, emptyProject, validateSceneProject } from "@lib/sceneSchema"
import type { Point, Hotspot } from "@lib/sceneSchema"
import { loadFileAsText, saveTextFile } from "@lib/utils"
import HotspotPanel from "./HotspotPanel"
import { drawHotspot, hitTestHotspot, translateHotspot, moveVertexTo, setCircleRadius, insertVertex } from "./HotspotShape"

export default function ScenesEditor() {
  const [proj, setProj] = useState<SceneProject>(emptyProject())
  const [status, setStatus] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeSceneId, setActiveSceneId] = useState<string | undefined>(undefined)
  const [drag, setDrag] = useState<{ hsIndex: number; mode: "move"|"vertex"|"radius"; vertexIndex?: number; prevX: number; prevY: number } | null>(null)

  // load sample on first run
  useEffect(() => {
    fetch("/samples/scenes.json")
      .then(r => r.ok ? r.text() : Promise.reject("no sample"))
      .then(text => {
        try {
          const json = JSON.parse(text)
          const parsed = validateSceneProject(json)
          setProj(parsed)
          setActiveSceneId(parsed.scenes[0]?.id)
          setStatus("Загружен samples/scenes.json")
        } catch (e:any) {
          setStatus("Не удалось загрузить sample: " + e.message)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!canvas || !scene) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)
    // grid
    ctx.globalAlpha = 1
    ctx.strokeStyle = "#e9e9e9"
    for (let x=0; x<W; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
    for (let y=0; y<H; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(0+y,0+y); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }
    // background hint
    ctx.fillStyle = "#fafafa"
    ctx.fillRect(0,0,W,H)

    // draw hotspots
    for (const hs of scene.hotspots ?? []) {
      drawHotspot(ctx, proj, hs, W, H)
    }
  }, [proj, activeSceneId])

  function onImportClicked() {
    loadFileAsText(".json").then(text => {
      if (!text) return
      try {
        const parsed = validateSceneProject(JSON.parse(text))
        setProj(parsed)
        setActiveSceneId(parsed.scenes[0]?.id)
        setStatus("Импорт JSON выполнен")
      } catch (e:any) {
        setStatus("Ошибка валидации: " + e.message)
      }
    })
  }

  function onExportClicked() {
    const out = JSON.stringify(proj, null, 2)
    saveTextFile(out, "scenes.json")
    setStatus("Экспортировано scenes.json")
  }

  function addRectHotspot() {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const id = "hs_" + Math.random().toString(36).slice(2,8)
    const next = { ...proj, scenes: proj.scenes.map(s => s.id === scene.id
      ? { ...s, hotspots: [...(s.hotspots ?? []), { id, shape: "rect", rect: { x: 0.1, y: 0.1, w: 0.2, h: 0.12 }, tooltip: "Новый хотспот", action: { type: "go_scene", scene_id: scene.id } }] }
      : s
    )}
    setProj(validateSceneProject(next))
    setStatus("Добавлен прямоугольный хотспот")
  }

  function addPolygonHotspot() {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const id = "hs_" + Math.random().toString(36).slice(2,8)
    const points: Point[] = [[0.1,0.1],[0.2,0.1],[0.15,0.2]]
    const next = { ...proj, scenes: proj.scenes.map(s => s.id === scene.id
      ? { ...s, hotspots: [...(s.hotspots ?? []), { id, shape: "polygon", points, tooltip: "Новый полигон", action: { type: "go_scene", scene_id: scene.id } }] }
      : s
    )}
    setProj(validateSceneProject(next))
    setStatus("Добавлен полигональный хотспот")
  }

  function addCircleHotspot() {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const id = "hs_" + Math.random().toString(36).slice(2,8)
    const circle = { cx:0.3, cy:0.3, r:0.1 }
    const next = { ...proj, scenes: proj.scenes.map(s => s.id === scene.id
      ? { ...s, hotspots: [...(s.hotspots ?? []), { id, shape: "circle", circle, tooltip: "Новый круг", action: { type: "go_scene", scene_id: scene.id } }] }
      : s
    )}
    setProj(validateSceneProject(next))
    setStatus("Добавлен круглый хотспот")
  }

  const sceneList = useMemo(() => proj.scenes.map(s => (
    <li key={s.id}>
      <button onClick={() => setActiveSceneId(s.id)} style={{ fontWeight: activeSceneId===s.id?600:400 }}>
        {s.name || s.id}
      </button>
    </li>
  )), [proj, activeSceneId])

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!canvas || !scene) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const W = canvas.width, H = canvas.height
    for (let i=(scene.hotspots?.length||0)-1; i>=0; i--) {
      const hs = scene.hotspots![i]
      const hit = hitTestHotspot(proj, hs, W, H, x, y)
      if (hit) {
        if (hit.kind === "add") {
          const hsCopy: Hotspot = JSON.parse(JSON.stringify(hs))
          insertVertex(hsCopy, proj, hit.index, x, y, W, H)
          const hotspots = scene.hotspots!.map((h,j)=> j===i?hsCopy:h)
          const next = { ...proj, scenes: proj.scenes.map(s => s.id===scene.id? {...s, hotspots}: s) }
          setProj(validateSceneProject(next))
          setDrag({ hsIndex:i, mode:"vertex", vertexIndex: hit.index+1, prevX:x, prevY:y })
        } else if (hit.kind === "vertex") {
          setDrag({ hsIndex:i, mode:"vertex", vertexIndex: hit.index, prevX:x, prevY:y })
        } else if (hit.kind === "radius") {
          setDrag({ hsIndex:i, mode:"radius", prevX:x, prevY:y })
        } else if (hit.kind === "move") {
          setDrag({ hsIndex:i, mode:"move", prevX:x, prevY:y })
        }
        break
      }
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drag) return
    const canvas = canvasRef.current
    const sceneIndex = proj.scenes.findIndex(s => s.id === activeSceneId)
    if (!canvas || sceneIndex < 0) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const W = canvas.width, H = canvas.height
    const scene = proj.scenes[sceneIndex]
    const hs = scene.hotspots![drag.hsIndex]
    const hsCopy: Hotspot = JSON.parse(JSON.stringify(hs))
    if (drag.mode === "move") {
      translateHotspot(hsCopy, proj, x - drag.prevX, y - drag.prevY, W, H)
    } else if (drag.mode === "vertex" && drag.vertexIndex !== undefined) {
      moveVertexTo(hsCopy, proj, drag.vertexIndex, x, y, W, H)
    } else if (drag.mode === "radius") {
      setCircleRadius(hsCopy, proj, x, y, W, H)
    }
    const hotspots = scene.hotspots!.map((h,j)=> j===drag.hsIndex?hsCopy:h)
    const next = { ...proj, scenes: proj.scenes.map((s,si)=> si===sceneIndex? {...s, hotspots}: s) }
    setProj(validateSceneProject(next))
    setDrag({ ...drag, prevX:x, prevY:y })
  }

  function handleMouseUp() {
    setDrag(null)
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns: "280px 1fr", width:"100%" }}>
      <aside style={{ borderRight: "1px solid #eee", padding: 12 }}>
        <div style={{ display:"flex", gap:8, marginBottom: 8 }}>
          <button onClick={onImportClicked}>Импорт JSON</button>
          <button onClick={onExportClicked}>Экспорт JSON</button>
        </div>
        <HotspotPanel onAddRect={addRectHotspot} onAddPolygon={addPolygonHotspot} onAddCircle={addCircleHotspot} />
        <strong>Сцены</strong>
        <ul style={{ listStyle:"none", padding:0 }}>{sceneList}</ul>
        <div style={{ marginTop: 12, fontSize:12, opacity:0.8 }}>{status}</div>
      </aside>
      <section style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ width:"100%", height:"100%", maxWidth: "calc(100vw - 280px)", aspectRatio: "16/9", border:"1px solid #ddd", background:"#fff" }}
        />
      </section>
    </div>
  )
}
