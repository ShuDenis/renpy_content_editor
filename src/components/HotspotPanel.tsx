import React from "react"

interface Props {
  onAddRect: () => void
  onAddPolygon: () => void
  onAddCircle: () => void
}

export default function HotspotPanel({ onAddRect, onAddPolygon, onAddCircle }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <button onClick={onAddRect}>+ Rect</button>
      <button onClick={onAddPolygon}>+ Polygon</button>
      <button onClick={onAddCircle}>+ Circle</button>
    </div>
  )
}
