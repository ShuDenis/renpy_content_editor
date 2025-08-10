import { describe, it, expect } from 'vitest'
import type { Hotspot } from '@lib/sceneSchema'

describe('hotspot cloning', () => {
  it('preserves undefined and Date properties', () => {
    const original: Hotspot & { created: Date } = {
      id: 'hs1',
      shape: 'rect',
      rect: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 },
      tooltip: undefined,
      created: new Date('2024-06-01T00:00:00Z'),
    }
    const copy = structuredClone(original)
    expect(copy).not.toBe(original)
    expect('tooltip' in copy).toBe(true)
    expect(copy.tooltip).toBeUndefined()
    expect(copy.created).toBeInstanceOf(Date)
    expect(copy.created.getTime()).toBe(original.created.getTime())
  })
})
