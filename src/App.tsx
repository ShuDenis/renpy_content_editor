import React, { useRef, useState } from "react"
import ScenesEditor, { ScenesEditorHandle } from "@components/ScenesEditor"
import DialogEditor, { DialogEditorHandle } from "@components/DialogEditor"

type Tab = "scenes" | "dialogs"

export default function App() {
  const [tab, setTab] = useState<Tab>("scenes")
  const scenesRef = useRef<ScenesEditorHandle>(null)
  const dialogsRef = useRef<DialogEditorHandle>(null)

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, Arial", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Ren'Py Content Editor</h1>
        <nav style={{ display: "flex", gap: 8, marginLeft: 16 }}>
          <button onClick={() => setTab("scenes")} aria-pressed={tab==="scenes"}>Сцены</button>
          <button onClick={() => setTab("dialogs")} aria-pressed={tab==="dialogs"}>Диалоги</button>
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => (tab === "scenes" ? scenesRef.current?.load() : dialogsRef.current?.load())}>Загрузить</button>
          <button onClick={() => (tab === "scenes" ? scenesRef.current?.save() : dialogsRef.current?.save())}>Сохранить</button>
          <button onClick={() => (tab === "scenes" ? scenesRef.current?.importJson() : dialogsRef.current?.importJson())}>Импорт JSON</button>
          <button onClick={() => (tab === "scenes" ? scenesRef.current?.exportJson() : dialogsRef.current?.exportJson())}>Экспорт JSON</button>
          <button onClick={() => window.open('/images/', '_blank')}>Папка с картинками</button>
          <span style={{ opacity: 0.7 }}>v0.1.0</span>
        </div>
      </header>
      <main style={{ flex: 1, display: "flex" }}>
        {tab === "scenes" ? <ScenesEditor ref={scenesRef} /> : <DialogEditor ref={dialogsRef} />}
      </main>
      <footer style={{ padding: 8, borderTop: "1px solid #eee", fontSize: 12, opacity: 0.8 }}>
        JSON совместим со сцен-генератором и будущим генератором диалогов.
      </footer>
    </div>
  )
}
