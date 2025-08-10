import { z } from "zod"

export const Rect = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })
export const Circle = z.object({ cx: z.number(), cy: z.number(), r: z.number() })
export const PointSchema = z.tuple([z.number(), z.number()])
export type Point = z.infer<typeof PointSchema>

const Transition = z.object({ type: z.string(), duration: z.number().optional() })

const Action = z.discriminatedUnion("type", [
  z.object({ type: z.literal("go_scene"), scene_id: z.string(), transition: Transition.optional() }),
  z.object({ type: z.literal("jump_label"), label: z.string() }),
  z.object({ type: z.literal("call_label"), label: z.string() }),
  z.object({ type: z.literal("call_screen"), screen: z.string(), params: z.record(z.any()).optional() }),
  z.object({ type: z.literal("function"), name: z.string(), params: z.record(z.any()).optional() }),
])

export const HotspotSchema = z.object({
  id: z.string(),
  shape: z.enum(["rect","polygon","circle"]),
  rect: Rect.optional(),
  points: z.array(PointSchema).optional(),
  circle: Circle.optional(),
  tooltip: z.string().optional(),
  hover_effect: z.record(z.any()).optional(),
  action: Action.optional(),
})

const LayerImage = z.object({ id: z.string(), type: z.literal("image"), image: z.string(), zorder: z.number().default(0) })
const LayerColor = z.object({ id: z.string(), type: z.literal("color"), color: z.string(), alpha: z.number().default(1), zorder: z.number().default(0) })
const Layer = z.discriminatedUnion("type", [LayerImage, LayerColor])

const Scene = z.object({
  id: z.string(),
  name: z.string().optional(),
  enter_transition: Transition.optional(),
  layers: z.array(Layer).default([]),
  hotspots: z.array(HotspotSchema).default([])
})

const Project = z.object({
  reference_resolution: z.object({ width: z.number(), height: z.number() }),
  coords_mode: z.enum(["relative","absolute"]).default("relative")
})

export const SceneProjectSchema = z.object({
  version: z.string().default("1.0"),
  project: Project,
  scenes: z.array(Scene).default([])
})

export type SceneProject = z.infer<typeof SceneProjectSchema>
export type Hotspot = z.infer<typeof HotspotSchema>

export function validateSceneProject(data: unknown): SceneProject {
  const parsed = SceneProjectSchema.parse(data)
  return parsed
}

export function emptyProject(): SceneProject {
  return {
    version: "1.0",
    project: { reference_resolution: { width: 1920, height: 1080 }, coords_mode: "relative" },
    scenes: []
  }
}
