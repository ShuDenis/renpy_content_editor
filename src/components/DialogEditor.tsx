import React, { useEffect, useState } from "react"
import ReactFlow, { Background, Controls, MiniMap, addEdge, Connection, ReactFlowProvider, Node, Edge, useEdgesState, useNodesState } from "reactflow"
import 'reactflow/dist/style.css'
import { DialogProject, emptyDialogProject, validateDialogProject } from "@lib/dialogSchema"
import { loadFileAsText, saveTextFile } from "@lib/utils"

interface DialogNodeData {
  label: string
}

interface DialogEdgeData {}

type DialogNode = Node<DialogNodeData>
type DialogEdge = Edge<DialogEdgeData>

function Graph() {
  const [proj, setProj] = useState<DialogProject>(emptyDialogProject())
  const [nodes, setNodes, onNodesChange] = useNodesState<DialogNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<DialogEdgeData>([])
  const [status, setStatus] = useState("")

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
    const d0: DialogProject["dialogs"][number] = proj.dialogs[0] || { id: "dlg_1", nodes: [] }
    const next: DialogProject = {
      ...proj,
      dialogs: [
        { ...d0, nodes: [...d0.nodes, { id, text: "Новая реплика", choices: [] }] },
        ...proj.dialogs.slice(1)
      ]
    }
    setProj(validateDialogProject(next))
    setStatus("Добавлен узел-реплика")
  }

  function onConnect(c: Connection) {
    if (!c.source || !c.target) return
    const d0 = proj.dialogs[0]
    if (!d0) return
    const nodes = d0.nodes.map(n => n.id===c.source
      ? { ...n, choices: [...(n.choices || []), { text: "→", next: c.target! }] }
      : n
    )
    const next: DialogProject = { ...proj, dialogs: [{ ...d0, nodes }] }
    setProj(validateDialogProject(next))
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
    <div style={{ display:"grid", gridTemplateColumns: "240px 1fr", width:"100%" }}>
      <aside style={{ borderRight: "1px solid #eee", padding: 12 }}>
        <div style={{ display:"flex", gap:8, marginBottom: 8 }}>
          <button onClick={importJson}>Импорт JSON</button>
          <button onClick={exportJson}>Экспорт JSON</button>
        </div>
        <button onClick={addNode}>+ Узел</button>
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
