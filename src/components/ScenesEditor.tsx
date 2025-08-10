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
  const [selectedHs, setSelectedHs] = useState<number | null>(null)

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
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
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

    // border of scene
    ctx.strokeStyle = "#bbb"
    ctx.lineWidth = 1
    ctx.strokeRect(0.5,0.5,W-1,H-1)

    // draw hotspots
    for (const hs of scene.hotspots ?? []) {
      if (!hs.hidden) drawHotspot(ctx, proj, hs, W, H)
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

  function updateHotspot(index: number, hs: Hotspot) {
    const sceneIndex = proj.scenes.findIndex(s => s.id === activeSceneId)
    if (sceneIndex < 0) return
    const scene = proj.scenes[sceneIndex]
    const hotspots = scene.hotspots!.map((h,i)=> i===index?hs:h)
    const next = { ...proj, scenes: proj.scenes.map((s,i)=> i===sceneIndex?{...s, hotspots}:s) }
    setProj(validateSceneProject(next))
  }

  function toggleHotspotVisibility(index: number) {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const hs = scene.hotspots![index]
    const hsCopy = { ...hs, hidden: !hs.hidden }
    updateHotspot(index, hsCopy)
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!canvas || !scene) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const W = canvas.width, H = canvas.height
    for (let i=(scene.hotspots?.length||0)-1; i>=0; i--) {
      const hs = scene.hotspots![i]
      if (hs.hidden) continue
      const hit = hitTestHotspot(proj, hs, W, H, x, y)
      if (hit) {
        setSelectedHs(i)
        if (hit.kind === "add") {
          const hsCopy: Hotspot = structuredClone(hs)
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
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const W = canvas.width, H = canvas.height
    const scene = proj.scenes[sceneIndex]
    const hs = scene.hotspots![drag.hsIndex]
    const hsCopy: Hotspot = structuredClone(hs)
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

  const activeScene = proj.scenes.find(s => s.id === activeSceneId)

  const activeHotspot = selectedHs !== null && activeScene ? activeScene.hotspots![selectedHs] : null

  function handleSceneNameChange(name: string) {
    const sceneIndex = proj.scenes.findIndex(s => s.id === activeSceneId)
    if (sceneIndex < 0) return
    const next = { ...proj, scenes: proj.scenes.map((s,i)=> i===sceneIndex? { ...s, name }: s) }
    setProj(validateSceneProject(next))
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns: "280px 1fr 300px", width:"100%" }}>
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
          style={{ width:"100%", height:"100%", maxWidth: "calc(100vw - 580px)", aspectRatio: "16/9", border:"1px solid #ddd", background:"#fff" }}
        />
      </section>
      <aside style={{ borderLeft:"1px solid #eee", padding:12, overflowY:"auto" }}>
        {activeScene && (
          <>
            <strong>Параметры сцены</strong>
            <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
              <label>Название
                <input value={activeScene.name||""} onChange={e=>handleSceneNameChange(e.target.value)} />
              </label>
            </div>
            <strong>Элементы</strong>
            <ul style={{ listStyle:"none", padding:0 }}>
              {activeScene.hotspots?.map((hs,i)=> (
                <li key={hs.id} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <button onClick={()=>toggleHotspotVisibility(i)}>{hs.hidden?"🙈":"👁️"}</button>
                  <button onClick={()=>setSelectedHs(i)} style={{ fontWeight:selectedHs===i?600:400 }}>
                    {hs.tooltip || hs.id}
                  </button>
                </li>
              ))}
            </ul>
            {activeHotspot && (
              <div style={{ marginTop:8 }}>
                <strong>Свойства</strong>
                {activeHotspot.shape === "rect" && activeHotspot.rect && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                    <label>X<input type="number" step="0.01" value={activeHotspot.rect.x} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, rect:{ ...activeHotspot.rect!, x: parseFloat(e.target.value) } })} /></label>
                    <label>Y<input type="number" step="0.01" value={activeHotspot.rect.y} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, rect:{ ...activeHotspot.rect!, y: parseFloat(e.target.value) } })} /></label>
                    <label>W<input type="number" step="0.01" value={activeHotspot.rect.w} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, rect:{ ...activeHotspot.rect!, w: parseFloat(e.target.value) } })} /></label>
                    <label>H<input type="number" step="0.01" value={activeHotspot.rect.h} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, rect:{ ...activeHotspot.rect!, h: parseFloat(e.target.value) } })} /></label>
                  </div>
                )}
                {activeHotspot.shape === "circle" && activeHotspot.circle && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                    <label>CX<input type="number" step="0.01" value={activeHotspot.circle.cx} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, circle:{ ...activeHotspot.circle!, cx: parseFloat(e.target.value) } })} /></label>
                    <label>CY<input type="number" step="0.01" value={activeHotspot.circle.cy} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, circle:{ ...activeHotspot.circle!, cy: parseFloat(e.target.value) } })} /></label>
                    <label>R<input type="number" step="0.01" value={activeHotspot.circle.r} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, circle:{ ...activeHotspot.circle!, r: parseFloat(e.target.value) } })} /></label>
                  </div>
                )}
                {activeHotspot.shape === "polygon" && activeHotspot.points && (
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <label>Количество точек
                      <input type="number" min={3} value={activeHotspot.points.length} onChange={e=>{
                        const n = parseInt(e.target.value)
                        let pts: [number, number][] = [...(activeHotspot.points as [number,number][])]
                        if (n > pts.length) {
                          const last = pts[pts.length-1]
                          while (pts.length < n) pts.push([...last] as [number,number])
                        } else if (n < pts.length) {
                          pts = pts.slice(0,n)
                        }
                        updateHotspot(selectedHs!, { ...activeHotspot, points: pts as [number,number][] })
                      }} />
                    </label>
                    {activeHotspot.points.map((pt,i)=> (
                      <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                        <input type="number" step="0.01" value={pt[0]} onChange={e=>{
                          const pts = activeHotspot.points!.map((p,j)=> j===i?[parseFloat(e.target.value),p[1]] as [number,number]:p as [number,number])
                          updateHotspot(selectedHs!, { ...activeHotspot, points: pts as [number,number][] })
                        }} />
                        <input type="number" step="0.01" value={pt[1]} onChange={e=>{
                          const pts = activeHotspot.points!.map((p,j)=> j===i?[p[0],parseFloat(e.target.value)] as [number,number]:p as [number,number])
                          updateHotspot(selectedHs!, { ...activeHotspot, points: pts as [number,number][] })
                        }} />
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop:8 }}>
                  <label>Tooltip
                    <input value={activeHotspot.tooltip||""} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, tooltip:e.target.value })} />
                  </label>
                </div>
                <div style={{ marginTop:8 }}>
                  <label>Action
                    <select value={activeHotspot.action?.type||""} onChange={e=>{
                      const type = e.target.value as any
                      let action: any = undefined
                      if (type === "go_scene") action = { type, scene_id: activeSceneId! }
                      else if (type === "jump_label") action = { type, label: "" }
                      else if (type === "call_label") action = { type, label: "" }
                      else if (type === "call_screen") action = { type, screen: "" }
                      else if (type === "function") action = { type, name: "" }
                      updateHotspot(selectedHs!, { ...activeHotspot, action })
                    }}>
                      <option value="">none</option>
                      <option value="go_scene">go_scene</option>
                      <option value="jump_label">jump_label</option>
                      <option value="call_label">call_label</option>
                      <option value="call_screen">call_screen</option>
                      <option value="function">function</option>
                    </select>
                  </label>
                  {activeHotspot.action?.type === "go_scene" && (
                    <input value={(activeHotspot.action as any).scene_id} onChange={e=>{
                      const action = { ...(activeHotspot.action as any), scene_id: e.target.value }
                      updateHotspot(selectedHs!, { ...activeHotspot, action })
                    }} />
                  )}
                  {activeHotspot.action?.type === "jump_label" && (
                    <input value={(activeHotspot.action as any).label} onChange={e=>{
                      const action = { ...(activeHotspot.action as any), label: e.target.value }
                      updateHotspot(selectedHs!, { ...activeHotspot, action })
                    }} />
                  )}
                  {activeHotspot.action?.type === "call_label" && (
                    <input value={(activeHotspot.action as any).label} onChange={e=>{
                      const action = { ...(activeHotspot.action as any), label: e.target.value }
                      updateHotspot(selectedHs!, { ...activeHotspot, action })
                    }} />
                  )}
                  {activeHotspot.action?.type === "call_screen" && (
                    <input value={(activeHotspot.action as any).screen} onChange={e=>{
                      const action = { ...(activeHotspot.action as any), screen: e.target.value }
                      updateHotspot(selectedHs!, { ...activeHotspot, action })
                    }} />
                  )}
                  {activeHotspot.action?.type === "function" && (
                    <input value={(activeHotspot.action as any).name} onChange={e=>{
                      const action = { ...(activeHotspot.action as any), name: e.target.value }
                      updateHotspot(selectedHs!, { ...activeHotspot, action })
                    }} />
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  )
}
