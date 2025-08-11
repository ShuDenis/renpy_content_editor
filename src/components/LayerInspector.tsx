import React from "react"
import type { Layer } from "@core/sceneSchema"

type Props = {
  layer: Layer | null
  onChange(layer: Layer): void
}

function TransitionEditor({ label, value, onChange }: { label: string; value?: { type: string; duration?: number; easing?: string }; onChange(v?: { type: string; duration?: number; easing?: string }): void }) {
  return (
    <div style={{ marginTop: 4 }}>
      <label>{label} type
        <input
          value={value?.type || ""}
          onChange={e => {
            const type = e.target.value
            onChange(type ? { type, duration: value?.duration, easing: value?.easing } : undefined)
          }}
        />
      </label>
      <label>
        duration
        <input
          type="number"
          value={value?.duration ?? ""}
          onChange={e => {
            const d = e.target.value
            onChange(value ? { ...value, duration: d === "" ? undefined : parseFloat(d) } : { type: "", duration: parseFloat(d) })
          }}
        />
      </label>
      <label>
        easing
        <input
          value={value?.easing || ""}
          onChange={e => {
            const easing = e.target.value
            onChange(value ? { ...value, easing } : { type: "", easing })
          }}
        />
      </label>
    </div>
  )
}

export default function LayerInspector({ layer, onChange }: Props) {
  if (!layer) return null
  return (
    <div style={{ marginTop: 8 }}>
      {layer.type === "image" && (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <span style={{ fontSize:12, wordBreak:"break-all" }}>{layer.image}</span>
          <button
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "image/png,image/jpeg,image/webp"
              input.onchange = () => {
                const file = input.files?.[0]
                if (file) {
                  const url = URL.createObjectURL(file)
                  onChange({ ...layer, image: url })
                }
                input.remove()
              }
              input.click()
            }}
          >
            Replace image
          </button>
        </div>
      )}
      {layer.type === "color" && (
        <label>Color
          <input type="color" value={layer.color} onChange={e => onChange({ ...layer, color: e.target.value })} />
        </label>
      )}
      <label>Opacity
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={layer.alpha}
          onChange={e => onChange({ ...layer, alpha: parseFloat(e.target.value) })}
        />
      </label>
      <TransitionEditor
        label="Enter"
        value={layer.enter_transition}
        onChange={v => onChange({ ...layer, enter_transition: v })}
      />
      <TransitionEditor
        label="Exit"
        value={layer.exit_transition}
        onChange={v => onChange({ ...layer, exit_transition: v })}
      />
    </div>
  )
}
