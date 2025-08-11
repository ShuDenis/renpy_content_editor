import { createContext, useContext } from "react"
import type { Hotspot } from "@core/sceneSchema"

type Ctx = { hotspot: Hotspot; setHotspot(hs: Hotspot): void }

export const HotspotContext = createContext<Ctx | null>(null)

export function useHotspot() {
  const ctx = useContext(HotspotContext)
  if (!ctx) throw new Error("HotspotContext not provided")
  return ctx
}
