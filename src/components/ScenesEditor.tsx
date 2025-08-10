import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { SceneProject, emptyProject, validateSceneProject } from "@lib/sceneSchema"
import { loadFileAsText, saveTextFile } from "@lib/utils"

export interface ScenesEditorHandle {
  importJson: () => void
  exportJson: () => void
  save: () => void
  load: () => void
}

const ScenesEditor = forwardRef<ScenesEditorHandle>((props, ref) => {
  const [proj, setProj] = useState<SceneProject>(emptyProject())
  const [status, setStatus] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeSceneId, setActiveSceneId] = useState<string | undefined>(undefined)

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

    // draw hotspots (rect only for MVP)
    ctx.save()
    ctx.strokeStyle = "#333"
    ctx.fillStyle = "rgba(0,0,0,0.06)"
    const refW = proj.project.reference_resolution.width
    const refH = proj.project.reference_resolution.height
    const rel = proj.project.coords_mode === "relative"
    for (const hs of scene.hotspots ?? []) {
      if (hs.shape !== "rect" || !hs.rect) continue
      const x = rel ? hs.rect.x * W : hs.rect.x * (W/refW)
      const y = rel ? hs.rect.y * H : hs.rect.y * (H/refH)
      const w = rel ? hs.rect.w * W : hs.rect.w * (W/refW)
      const h = rel ? hs.rect.h * H : hs.rect.h * (H/refH)
      ctx.fillRect(x,y,w,h)
      ctx.strokeRect(x,y,w,h)
    }
    ctx.restore()
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

  function onSave() {
    localStorage.setItem("scenesProject", JSON.stringify(proj))
    setStatus("Проект сохранён в браузере")
  }

  function onLoad() {
    const text = localStorage.getItem("scenesProject")
    if (!text) {
      setStatus("Нет сохранённого проекта")
      return
    }
    try {
      const parsed = validateSceneProject(JSON.parse(text))
      setProj(parsed)
      setActiveSceneId(parsed.scenes[0]?.id)
      setStatus("Проект загружен из браузера")
    } catch (e:any) {
      setStatus("Ошибка загрузки: " + e.message)
    }
  }

  useImperativeHandle(ref, () => ({
    importJson: onImportClicked,
    exportJson: onExportClicked,
    save: onSave,
    load: onLoad,
  }))

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

  const sceneList = useMemo(() => proj.scenes.map(s => (
    <li key={s.id}>
      <button onClick={() => setActiveSceneId(s.id)} style={{ fontWeight: activeSceneId===s.id?600:400 }}>
        {s.name || s.id}
      </button>
    </li>
  )), [proj, activeSceneId])

  return (
    <div style={{ display:"grid", gridTemplateColumns: "280px 1fr", width:"100%" }}>
      <aside style={{ borderRight: "1px solid #eee", padding: 12 }}>
        <div style={{ display:"flex", gap:8, marginBottom: 8 }}>
          <button onClick={addRectHotspot}>+ Rect Hotspot</button>
        </div>
        <strong>Сцены</strong>
        <ul style={{ listStyle:"none", padding:0 }}>{sceneList}</ul>
        <div style={{ marginTop: 12, fontSize:12, opacity:0.8 }}>{status}</div>
      </aside>
      <section style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <canvas ref={canvasRef} width={960} height={540} style={{ width:"100%", height:"100%", maxWidth: "calc(100vw - 280px)", aspectRatio: "16/9", border:"1px solid #ddd", background:"#fff" }} />
      </section>
    </div>
  )
})

export default ScenesEditor
