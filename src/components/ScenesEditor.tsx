import React, { useEffect, useMemo, useRef, useState } from "react"
import { SceneProject, emptyProject, validateSceneProject, Layer } from "@lib/sceneSchema"
import { useUndoState } from "@lib/useUndo"
import type { Point, Hotspot } from "@lib/sceneSchema"
import { round3, convertProjectCoordsMode } from "@lib/utils"
import { importSceneProjectFromFile, exportSceneProjectToFile, saveProjectToStorage, loadProjectFromStorage, parseSceneProject } from "@lib/scenePersistence"
import HotspotPanel from "./HotspotPanel"
import { drawHotspot, hitTestHotspot, translateHotspot, moveVertexTo, setCircleRadius, insertVertex } from "./HotspotShape"
import LayerPanel from "./LayerPanel"
import LayerInspector from "./LayerInspector"
import CanvasView from "./CanvasView"
import HotspotInspector from "./HotspotInspector"
import { HotspotContext } from "./HotspotContext"

export default function ScenesEditor() {
  const [proj, setProj, resetProj, undo, redo] = useUndoState<SceneProject>(emptyProject(), validateSceneProject)
  const [status, setStatus] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeSceneId, setActiveSceneId] = useState<string | undefined>(undefined)
  const [drag, setDrag] = useState<{ hsIndex: number; mode: "move"|"vertex"|"radius"; vertexIndex?: number; prevX: number; prevY: number } | null>(null)
  const [selectedHs, setSelectedHs] = useState<number | null>(null)
  const [manualRes, setManualRes] = useState(false)
  const [preview, setPreview] = useState(false)
  const [useWebGL, setUseWebGL] = useState(false)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  const resolutions = [
    { label: "640x480", width: 640, height: 480 },
    { label: "800x600", width: 800, height: 600 },
    { label: "1024x768", width: 1024, height: 768 },
    { label: "1280x720", width: 1280, height: 720 },
    { label: "1920x1080", width: 1920, height: 1080 },
  ]

  // load from localStorage or sample on first run
  useEffect(() => {
    const stored = loadProjectFromStorage()
    if (stored) {
      resetProj(stored)
      setActiveSceneId(stored.scenes[0]?.id)
      setStatus("Загружен проект из localStorage")
      return
    }
    fetch("/samples/scenes.json")
      .then(r => r.ok ? r.text() : Promise.reject("no sample"))
      .then(text => {
        try {
          const json = JSON.parse(text)
          const parsed = parseSceneProject(json)
          resetProj(parsed)
          setActiveSceneId(parsed.scenes[0]?.id)
          setStatus("Загружен samples/scenes.json")
        } catch (e:any) {
          setStatus("Не удалось загрузить sample: " + e.message)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setSelectedHs(null)
    setSelectedLayerId(null)
  }, [activeSceneId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo])

  useEffect(() => {
    const canvas = canvasRef.current
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!canvas || !scene) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    setCanvasSize({ width: canvas.width, height: canvas.height })
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0,0,W,H)
    // grid
    ctx.globalAlpha = 1
    ctx.strokeStyle = "#e9e9e9"
    for (let x=0; x<W; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
    for (let y=0; y<H; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }

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
    importSceneProjectFromFile().then(parsed => {
      if (!parsed) return
      try {
        setProj(parsed)
        setActiveSceneId(parsed.scenes[0]?.id)
        setStatus("Импорт JSON выполнен")
      } catch (e:any) {
        setStatus("Ошибка валидации: " + e.message)
      }
    }).catch((e:any) => {
      setStatus("Ошибка валидации: " + e.message)
    })
  }

  function onExportClicked() {
    exportSceneProjectToFile(proj)
    setStatus("Экспортировано scenes.json")
  }

  function onSaveClicked() {
    saveProjectToStorage(proj)
    setStatus("Сохранено в localStorage")
  }

  function onLoadClicked() {
    const loaded = loadProjectFromStorage()
    if (loaded) {
      setProj(loaded)
      setActiveSceneId(loaded.scenes[0]?.id)
      setStatus("Загружено из localStorage")
    } else {
      setStatus("Нет сохранённого проекта")
    }
  }

  function addImageLayer() {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const id = "layer_" + Math.random().toString(36).slice(2,8)
    const layers = [...scene.layers, { id, type: "image" as const, image: "", alpha: 1, zorder: scene.layers.length }]
    const next = { ...proj, scenes: proj.scenes.map(s => s.id === scene.id ? { ...s, layers } : s) }
    setProj(next)
    setSelectedLayerId(id)
  }

  function addColorLayer() {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const id = "layer_" + Math.random().toString(36).slice(2,8)
    const layers = [...scene.layers, { id, type: "color" as const, color: "#000000", alpha: 1, zorder: scene.layers.length }]
    const next = { ...proj, scenes: proj.scenes.map(s => s.id === scene.id ? { ...s, layers } : s) }
    setProj(next)
    setSelectedLayerId(id)
  }

  function updateLayer(id: string, layer: Layer) {
    const sceneIndex = proj.scenes.findIndex(s => s.id === activeSceneId)
    if (sceneIndex < 0) return
    const scene = proj.scenes[sceneIndex]
    const layers = scene.layers.map(l => l.id === id ? layer : l).map((l,i) => ({ ...l, zorder: i }))
    const next = { ...proj, scenes: proj.scenes.map((s,i)=> i===sceneIndex? { ...s, layers }: s) }
    setProj(next)
  }

  function deleteLayer(id: string) {
    const sceneIndex = proj.scenes.findIndex(s => s.id === activeSceneId)
    if (sceneIndex < 0) return
    const scene = proj.scenes[sceneIndex]
    const layers = scene.layers.filter(l => l.id !== id).map((l,i)=> ({ ...l, zorder: i }))
    const next = { ...proj, scenes: proj.scenes.map((s,i)=> i===sceneIndex? { ...s, layers }: s) }
    setProj(next)
    if (selectedLayerId === id) setSelectedLayerId(null)
  }

  function copyLayer(id: string) {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const layer = scene.layers.find(l => l.id === id)
    if (!layer) return
    const newId = id + "_copy"
    const copy: Layer = { ...layer, id: newId }
    const layers = [...scene.layers, { ...copy, zorder: scene.layers.length }]
    const next = { ...proj, scenes: proj.scenes.map(s => s.id === scene.id ? { ...s, layers } : s) }
    setProj(next)
    setSelectedLayerId(newId)
  }

  function addDroppedImage(src: string) {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const id = "layer_" + Math.random().toString(36).slice(2,8)
    const layers = [...scene.layers, { id, type: "image" as const, image: src, alpha: 1, zorder: scene.layers.length }]
    const next = { ...proj, scenes: proj.scenes.map(s => s.id === scene.id ? { ...s, layers } : s) }
    setProj(next)
    setSelectedLayerId(id)
  }

  function reorderLayers(from: number, to: number) {
    const sceneIndex = proj.scenes.findIndex(s => s.id === activeSceneId)
    if (sceneIndex < 0) return
    const scene = proj.scenes[sceneIndex]
    const layers = [...scene.layers]
    const [item] = layers.splice(from, 1)
    layers.splice(to, 0, item)
    const relabeled = layers.map((l,i)=> ({ ...l, zorder: i }))
    const next = { ...proj, scenes: proj.scenes.map((s,i)=> i===sceneIndex? { ...s, layers: relabeled }: s) }
    setProj(next)
  }

  function addRectHotspot() {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const id = "hs_" + Math.random().toString(36).slice(2,8)
    const hs: Hotspot = {
      id,
      shape: "rect",
      rect: { x: 0.1, y: 0.1, w: 0.2, h: 0.12 },
      tooltip: "Новый хотспот",
      action: { type: "go_scene", scene_id: scene.id },
      hidden: false,
    }
    const next = {
      ...proj,
      scenes: proj.scenes.map(s =>
        s.id === scene.id
          ? { ...s, hotspots: [...(s.hotspots ?? []), hs] }
          : s
      ),
    }
    setProj(next)
    setStatus("Добавлен прямоугольный хотспот")
  }

  function addPolygonHotspot() {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const id = "hs_" + Math.random().toString(36).slice(2,8)
    const points: Point[] = [[0.1,0.1],[0.2,0.1],[0.15,0.2]]
    const hs: Hotspot = {
      id,
      shape: "polygon",
      points,
      tooltip: "Новый полигон",
      action: { type: "go_scene", scene_id: scene.id },
      hidden: false,
    }
    const next = {
      ...proj,
      scenes: proj.scenes.map(s =>
        s.id === scene.id
          ? { ...s, hotspots: [...(s.hotspots ?? []), hs] }
          : s
      ),
    }
    setProj(next)
    setStatus("Добавлен полигональный хотспот")
  }

  function addCircleHotspot() {
    const scene = proj.scenes.find(s => s.id === activeSceneId)
    if (!scene) return
    const id = "hs_" + Math.random().toString(36).slice(2,8)
    const circle = { cx:0.3, cy:0.3, r:0.1 }
    const hs: Hotspot = {
      id,
      shape: "circle",
      circle,
      tooltip: "Новый круг",
      action: { type: "go_scene", scene_id: scene.id },
      hidden: false,
    }
    const next = {
      ...proj,
      scenes: proj.scenes.map(s =>
        s.id === scene.id
          ? { ...s, hotspots: [...(s.hotspots ?? []), hs] }
          : s
      ),
    }
    setProj(next)
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
    setProj(next)
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
          setProj(next)
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
    setProj(next)
    setDrag({ ...drag, prevX:x, prevY:y })
  }

  function handleMouseUp() {
    setDrag(null)
  }

  const activeScene = proj.scenes.find(s => s.id === activeSceneId)

  const activeHotspot = selectedHs !== null && activeScene ? activeScene.hotspots![selectedHs] : null
  const activeLayer = activeScene?.layers.find(l => l.id === selectedLayerId) || null

  function handleSceneNameChange(name: string) {
    const sceneIndex = proj.scenes.findIndex(s => s.id === activeSceneId)
    if (sceneIndex < 0) return
    const next = { ...proj, scenes: proj.scenes.map((s,i)=> i===sceneIndex? { ...s, name }: s) }
    setProj(next)
  }

  function openPreview() {
    document.documentElement.requestFullscreen?.()
    setPreview(true)
  }

  function closePreview() {
    if (document.fullscreenElement) document.exitFullscreen()
    setPreview(false)
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns: "280px 1fr 300px", width:"100%" }}>
      <aside style={{ borderRight: "1px solid #eee", padding: 12 }}>
        <div style={{ display:"flex", gap:8, marginBottom: 8, alignItems:"center" }}>
          <button onClick={onImportClicked}>Импорт JSON</button>
          <button onClick={onExportClicked}>Экспорт JSON</button>
          <button onClick={onSaveClicked}>Сохранить</button>
          <button onClick={onLoadClicked}>Загрузить</button>
          <button onClick={openPreview}>Превью</button>
          <label style={{ display:"flex", alignItems:"center", gap:4 }}>
            <input type="checkbox" checked={useWebGL} onChange={e=>setUseWebGL(e.target.checked)} />WebGL
          </label>
        </div>
        <div style={{ marginBottom:8 }}>
          <strong>Экран</strong>
          {!manualRes ? (
            <div style={{ display:"flex", gap:4 }}>
              <select value={`${proj.project.reference_resolution.width}x${proj.project.reference_resolution.height}`} onChange={e=>{
                const [w,h] = e.target.value.split('x').map(n=>parseInt(n))
                const next = { ...proj, project: { ...proj.project, reference_resolution: { width:w, height:h } } }
                setProj(next)
              }}>
                {resolutions.map(r=> (
                  <option key={r.label} value={`${r.width}x${r.height}`}>{r.label}</option>
                ))}
              </select>
              <button onClick={()=>setManualRes(true)}>Manual</button>
            </div>
          ) : (
            <div style={{ display:"flex", gap:4 }}>
              <input type="number" value={proj.project.reference_resolution.width} onChange={e=>{
                const w = parseInt(e.target.value)||0
                const next = { ...proj, project: { ...proj.project, reference_resolution: { ...proj.project.reference_resolution, width:w } } }
                setProj(next)
              }} />
              <input type="number" value={proj.project.reference_resolution.height} onChange={e=>{
                const h = parseInt(e.target.value)||0
                const next = { ...proj, project: { ...proj.project, reference_resolution: { ...proj.project.reference_resolution, height:h } } }
                setProj(next)
              }} />
              <button onClick={()=>setManualRes(false)}>Presets</button>
            </div>
          )}
          <label style={{ display:'block', marginTop:4 }}>Mode
            <select value={proj.project.coords_mode} onChange={e=>{
              const mode = e.target.value as 'relative'|'absolute'
              const converted = convertProjectCoordsMode(proj, mode)
              setProj(converted)
            }}>
              <option value="relative">relative</option>
              <option value="absolute">absolute</option>
            </select>
          </label>
        </div>
        <HotspotPanel onAddRect={addRectHotspot} onAddPolygon={addPolygonHotspot} onAddCircle={addCircleHotspot} />
        <strong>Сцены</strong>
        <ul style={{ listStyle:"none", padding:0 }}>{sceneList}</ul>
        <div style={{ marginTop: 12, fontSize:12, opacity:0.8 }}>{status}</div>
      </aside>
      <section style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div
          style={{ width:"100%", height:"100%", maxWidth: "calc(100vw - 580px)", aspectRatio: "16/9", position:"relative", border:"1px solid #ddd", background:"#fff" }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const files = e.dataTransfer.files
            for (const file of Array.from(files)) {
              if (["image/png","image/jpeg","image/webp"].includes(file.type)) {
                const url = URL.createObjectURL(file)
                addDroppedImage(url)
              }
            }
            const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain")
            if (uri && uri.match(/\.(png|jpe?g|webp)$/i)) addDroppedImage(uri.trim())
          }}
        >
          <CanvasView
            layers={activeScene?.layers || []}
            width={canvasSize.width}
            height={canvasSize.height}
            onDropImage={addDroppedImage}
          />
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%" }}
          />
        </div>
      </section>
      <aside style={{ borderLeft:"1px solid #eee", padding:12, overflowY:"auto" }}>
        {activeScene && (
          <>
            <strong>Слои</strong>
            <LayerPanel
              layers={activeScene.layers}
              selectedId={selectedLayerId || undefined}
              onSelect={id => setSelectedLayerId(id)}
              onAddImage={addImageLayer}
              onAddColor={addColorLayer}
              onReorder={reorderLayers}
              onDelete={deleteLayer}
              onCopy={copyLayer}
            />
            <LayerInspector layer={activeLayer} onChange={l => updateLayer(l.id, l)} />
            <strong style={{ marginTop:8, display:"block" }}>Параметры сцены</strong>
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
                    <label>X<input type="number" step="0.001" value={activeHotspot.rect.x} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, rect:{ ...activeHotspot.rect!, x: round3(parseFloat(e.target.value)) } })} /></label>
                    <label>Y<input type="number" step="0.001" value={activeHotspot.rect.y} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, rect:{ ...activeHotspot.rect!, y: round3(parseFloat(e.target.value)) } })} /></label>
                    <label>W<input type="number" step="0.001" value={activeHotspot.rect.w} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, rect:{ ...activeHotspot.rect!, w: round3(parseFloat(e.target.value)) } })} /></label>
                    <label>H<input type="number" step="0.001" value={activeHotspot.rect.h} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, rect:{ ...activeHotspot.rect!, h: round3(parseFloat(e.target.value)) } })} /></label>
                  </div>
                )}
                {activeHotspot.shape === "circle" && activeHotspot.circle && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                    <label>CX<input type="number" step="0.001" value={activeHotspot.circle.cx} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, circle:{ ...activeHotspot.circle!, cx: round3(parseFloat(e.target.value)) } })} /></label>
                    <label>CY<input type="number" step="0.001" value={activeHotspot.circle.cy} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, circle:{ ...activeHotspot.circle!, cy: round3(parseFloat(e.target.value)) } })} /></label>
                    <label>R<input type="number" step="0.001" value={activeHotspot.circle.r} onChange={e=>updateHotspot(selectedHs!, { ...activeHotspot, circle:{ ...activeHotspot.circle!, r: round3(parseFloat(e.target.value)) } })} /></label>
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
                        <input type="number" step="0.001" value={pt[0]} onChange={e=>{
                          const pts = activeHotspot.points!.map((p,j)=> j===i?[round3(parseFloat(e.target.value)),p[1]] as [number,number]:p as [number,number])
                          updateHotspot(selectedHs!, { ...activeHotspot, points: pts as [number,number][] })
                        }} />
                        <input type="number" step="0.001" value={pt[1]} onChange={e=>{
                          const pts = activeHotspot.points!.map((p,j)=> j===i?[p[0],round3(parseFloat(e.target.value))] as [number,number]:p as [number,number])
                          updateHotspot(selectedHs!, { ...activeHotspot, points: pts as [number,number][] })
                        }} />
                      </div>
                    ))}
                  </div>
                )}
                <HotspotContext.Provider value={{ hotspot: activeHotspot, setHotspot: hs => updateHotspot(selectedHs!, hs) }}>
                  <HotspotInspector />
                </HotspotContext.Provider>
              </div>
            )}
          </>
        )}
      </aside>
      {preview && activeSceneId && (
        <CanvasView project={proj} sceneId={activeSceneId} useWebGL={useWebGL} onExit={closePreview} />
      )}
    </div>
  )
}
