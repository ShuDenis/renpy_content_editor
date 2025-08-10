import { z } from "zod"

// Minimal dialog schema shaped for a node-based editor MVP
const Choice = z.object({
  text: z.string().default(""),
  next: z.string().optional(),
  cond: z.string().optional(),
})

const Node = z.object({
  id: z.string(),
  text: z.string().optional(),
  speaker: z.string().optional(),
  choices: z.array(Choice).default([]),
})

const Dialog = z.object({
  id: z.string(),
  nodes: z.array(Node).default([]),
})

export const DialogProjectSchema = z.object({
  version: z.string().default("1.0"),
  dialogs: z.array(Dialog).default([{ id: "dlg_1", nodes: [] }])
})

export type DialogProject = z.infer<typeof DialogProjectSchema>

export function validateDialogProject(data: unknown): DialogProject {
  return DialogProjectSchema.parse(data)
}

export function emptyDialogProject(): DialogProject {
  return { version: "1.0", dialogs: [{ id: "dlg_1", nodes: [] }] }
}
