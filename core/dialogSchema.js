import { z } from "zod"

// Schema for dialog projects used by both the editor and CLI
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
  dialogs: z.array(Dialog).default([{ id: "dlg_1", nodes: [] }]),
})

export function validateDialogProject(data) {
  return DialogProjectSchema.parse(data)
}

export function emptyDialogProject() {
  return { version: "1.0", dialogs: [{ id: "dlg_1", nodes: [] }] }
}

