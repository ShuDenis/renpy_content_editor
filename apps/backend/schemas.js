import { z } from 'zod';
import { SceneProjectSchema } from '../../packages/core/sceneSchema.js';

export const SceneSchema = SceneProjectSchema.shape.scenes._def.innerType.element;

const Choice = z.object({
  text: z.string().default(''),
  next: z.string().optional(),
  cond: z.string().optional(),
});

const NodeSchema = z.object({
  id: z.string(),
  text: z.string().optional(),
  speaker: z.string().optional(),
  choices: z.array(Choice).default([]),
});

export const DialogSchema = z.object({
  id: z.string(),
  nodes: z.array(NodeSchema).default([]),
});

