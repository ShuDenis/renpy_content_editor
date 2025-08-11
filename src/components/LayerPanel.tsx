import React, { useState } from "react"
import type { Layer } from "@core/sceneSchema"

type Props = {
  layers: Layer[]
  selectedId?: string
  onSelect(id: string): void
  onAddImage(): void
  onAddColor(): void
  onReorder(from: number, to: number): void
  onDelete(id: string): void
  onCopy(id: string): void
}

export default function LayerPanel({ layers, selectedId, onSelect, onAddImage, onAddColor, onReorder, onDelete, onCopy }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null)

  const sorted = [...layers].sort((a, b) => a.zorder - b.zorder)

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <button onClick={onAddImage}>+ Image Layer</button>
        <button onClick={onAddColor}>+ Color Layer</button>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {sorted.map((layer, index) => (
          <li
            key={layer.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) {
                onReorder(dragIndex, index)
                setDragIndex(null)
              }
            }}
            onContextMenu={e => {
              e.preventDefault()
              setMenu({ id: layer.id, x: e.clientX, y: e.clientY })
            }}
          >
            <button
              onClick={() => onSelect(layer.id)}
              style={{
                width: "100%",
                textAlign: "left",
                background: selectedId === layer.id ? "#def" : undefined,
              }}
            >
              {layer.type === "image" ? layer.image || layer.id : layer.color}
            </button>
          </li>
        ))}
      </ul>
      {menu && (
        <ul
          style={{
            position: "fixed",
            top: menu.y,
            left: menu.x,
            background: "#fff",
            border: "1px solid #ccc",
            padding: 4,
            listStyle: "none",
            margin: 0,
          }}
          onMouseLeave={() => setMenu(null)}
        >
          <li>
            <button
              onClick={() => {
                onCopy(menu.id)
                setMenu(null)
              }}
            >
              Copy
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                onDelete(menu.id)
                setMenu(null)
              }}
            >
              Delete
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
