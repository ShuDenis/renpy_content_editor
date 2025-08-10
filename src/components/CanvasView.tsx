import React, { useEffect, useRef } from "react"
import type { Layer } from "@lib/sceneSchema"

type Props = {
  layers: Layer[]
  width: number
  height: number
}

export default function CanvasView({ layers, width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")!

    function draw() {
      ctx.clearRect(0, 0, width, height)
      const sorted = [...layers].sort((a, b) => a.zorder - b.zorder)
      for (const layer of sorted) {
        if (layer.type === "color") {
          ctx.globalAlpha = layer.alpha ?? 1
          ctx.fillStyle = layer.color
          ctx.fillRect(0, 0, width, height)
        } else if (layer.type === "image") {
          const cached = cacheRef.current.get(layer.image)
          if (cached && cached.complete) {
            ctx.globalAlpha = layer.alpha ?? 1
            ctx.drawImage(cached, 0, 0, width, height)
          } else {
            if (!cacheRef.current.has(layer.image)) {
              const img = new Image()
              img.src = layer.image
              img.onload = () => draw()
              cacheRef.current.set(layer.image, img)
            }
          }
        }
      }
      ctx.globalAlpha = 1
    }

    draw()
  }, [layers, width, height])

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
}
