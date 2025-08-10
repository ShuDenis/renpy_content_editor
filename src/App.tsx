import React, { useState } from "react"
import ScenesEditor from "@components/ScenesEditor"
import DialogEditor from "@components/DialogEditor"

type Tab = "scenes" | "dialogs"

export default function App() {
  const [tab, setTab] = useState<Tab>("scenes")

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, Arial", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", gap: 8, alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Ren'Py Content Editor</h1>
        <nav style={{ display: "flex", gap: 8, marginLeft: 16 }}>
          <button onClick={() => setTab("scenes")} aria-pressed={tab==="scenes"}>Сцены</button>
          <button onClick={() => setTab("dialogs")} aria-pressed={tab==="dialogs"}>Диалоги</button>
        </nav>
        <div style={{ marginLeft: "auto", opacity: 0.7 }}>v0.1.0</div>
      </header>
      <main style={{ flex: 1, display: "flex" }}>
        {tab === "scenes" ? <ScenesEditor /> : <DialogEditor />}
      </main>
      <footer style={{ padding: 8, borderTop: "1px solid #eee", fontSize: 12, opacity: 0.8 }}>
        JSON совместим со сцен-генератором и будущим генератором диалогов.
      </footer>
    </div>
  )
}
