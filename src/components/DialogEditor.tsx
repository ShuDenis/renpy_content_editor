import React, { useEffect, useState } from "react"
import ReactFlow, { Background, Controls, MiniMap, addEdge, Connection, ReactFlowProvider, Node, Edge, useEdgesState, useNodesState } from "reactflow"
import 'reactflow/dist/style.css'
import { DialogProject, emptyDialogProject, validateDialogProject } from "@lib/dialogSchema"
import { loadFileAsText, saveTextFile } from "@lib/utils"
import { useUndoState } from "@lib/useUndo"

interface DialogNodeData {
  label: string
}

interface DialogEdgeData {}

type DialogNode = Node<DialogNodeData>
type DialogEdge = Edge<DialogEdgeData>

function Graph() {
  const [proj, setProj, _resetProj, undo, redo] = useUndoState<DialogProject>(emptyDialogProject(), validateDialogProject)
  const [nodes, setNodes, onNodesChange] = useNodesState<DialogNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<DialogEdgeData>([])
  const [status, setStatus] = useState("")

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
    // project -> graph
    const ns: DialogNode[] = proj.dialogs.flatMap(d =>
      d.nodes.map((n, idx): DialogNode => ({
        id: n.id,
        data: { label: n.text?.slice(0, 40) || n.id },
        position: { x: (idx % 6) * 180, y: Math.floor(idx / 6) * 120 }
      }))
    )
    const es: DialogEdge[] = proj.dialogs.flatMap(d =>
      d.nodes.flatMap(n =>
        (n.choices || []).map((c): DialogEdge => ({
          id: `${n.id}->${c.next}`,
          source: n.id,
          target: c.next || n.id
        }))
      )
    )
    setNodes(ns); setEdges(es)
  }, [proj])

  function addNode() {
    const id = "n_" + Math.random().toString(36).slice(2,8)
    setProj(prev => {
      const d0: DialogProject["dialogs"][number] = prev.dialogs[0] || { id: "dlg_1", nodes: [] }
      const next: DialogProject = {
        ...prev,
        dialogs: [
          { ...d0, nodes: [...d0.nodes, { id, text: "Новая реплика", choices: [] }] },
          ...prev.dialogs.slice(1)
        ]
      }
      return next
    })
    setStatus("Добавлен узел-реплика")
  }

  function onConnect(c: Connection) {
    if (!c.source || !c.target) return
    setProj(prev => {
      const d0 = prev.dialogs[0]
      if (!d0) return prev
      const nodes = d0.nodes.map(n => n.id===c.source
        ? { ...n, choices: [...(n.choices || []), { text: "→", next: c.target! }] }
        : n
      )
      const next: DialogProject = { ...prev, dialogs: [{ ...d0, nodes }] }
      return next
    })
    setStatus(`Связь: ${c.source} → ${c.target}`)
    setEdges(eds => addEdge({ source: c.source!, target: c.target!, id: `${c.source}->${c.target}` }, eds))
  }

  function importJson() {
    loadFileAsText(".json").then(text => {
      if (!text) return
      try {
        const parsed = validateDialogProject(JSON.parse(text))
        setProj(parsed); setStatus("Импортирован JSON диалога")
      } catch (e:any) {
        setStatus("Ошибка: " + e.message)
      }
    })
  }

  function exportJson() {
    const out = JSON.stringify(proj, null, 2)
    saveTextFile(out, "dialogs.json")
    setStatus("Экспортирован dialogs.json")
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns: "240px 1fr", width:"100%", position:"relative" }}>
      <div style={{ position:"absolute", bottom:8, left:8, display:"flex", gap:8 }}>
        <button onClick={importJson}>Импорт JSON</button>
        <button onClick={exportJson}>Экспорт JSON</button>
      </div>
      <aside style={{ borderRight: "1px solid #eee", padding: 12 }}>
        <button onClick={addNode} style={{ marginBottom:8 }}>+ Узел</button>
        <div style={{ marginTop: 12, fontSize:12, opacity:0.8 }}>{status}</div>
        <p style={{ fontSize:12, opacity:0.8 }}>Подсказка: соединяйте узлы линиями для создания переходов.</p>
      </aside>
      <section style={{ position:"relative", height: "calc(100vh - 100px)" }}>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </section>
    </div>
  )
}

export default function DialogEditor(){
  return (
    <ReactFlowProvider>
      <Graph />
    </ReactFlowProvider>
  )
}
