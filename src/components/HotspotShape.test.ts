import { describe, it, expect, vi } from 'vitest'
import { drawHotspot, hitTestHotspot, translateHotspot, moveVertexTo, setCircleRadius, insertVertex } from './HotspotShape'
import type { SceneProject, Hotspot } from '@lib/sceneSchema'

const proj: SceneProject = {
  version: '1.0',
  project: { reference_resolution: { width: 100, height: 100 }, coords_mode: 'relative' },
  scenes: []
}

function mockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    translate: vi.fn(),
    // properties set
    strokeStyle: '',
    fillStyle: '',
    globalAlpha: 1
  } as any
}

describe('drawHotspot', () => {
  it('draws different shapes without error', () => {
    const ctx = mockCtx()
    drawHotspot(ctx, proj, { id: 'r', hidden: false, shape: 'rect', rect: { x: 0, y: 0, w: 0.2, h: 0.2 } }, 100, 100)
    drawHotspot(ctx, proj, { id: 'p', hidden: false, shape: 'polygon', points: [[0,0],[0.2,0],[0,0.2]] }, 100, 100)
    drawHotspot(ctx, proj, { id: 'c', hidden: false, shape: 'circle', circle: { cx:0.5, cy:0.5, r:0.1 } }, 100, 100)
    expect(ctx.fillRect).toHaveBeenCalled()
    expect(ctx.arc).toHaveBeenCalled()
  })
})

describe('hit testing and transformations', () => {
  it('detects hits for shapes', () => {
    const rect: Hotspot = { id:'r', hidden:false, shape:'rect', rect:{x:0,y:0,w:0.2,h:0.2} }
    expect(hitTestHotspot(proj, rect, 100,100,10,10)?.kind).toBe('move')

    const poly: Hotspot = { id:'p', hidden:false, shape:'polygon', points:[[0,0],[0.2,0],[0,0.2]] }
    expect(hitTestHotspot(proj, poly, 100,100,0,0)).toEqual({ kind:'vertex', index:0 })

    const circle: Hotspot = { id:'c', hidden:false, shape:'circle', circle:{cx:0.5, cy:0.5, r:0.1} }
    expect(hitTestHotspot(proj, circle, 100,100,60,50)?.kind).toBe('radius')
    expect(hitTestHotspot(proj, circle, 100,100,50,50)?.kind).toBe('move')
  })

  it('translates hotspots', () => {
    const rect: Hotspot = { id:'r', hidden:false, shape:'rect', rect:{x:0,y:0,w:0.1,h:0.1} }
    translateHotspot(rect, proj, 10, 20, 100, 100)
    expect(rect.rect?.x).toBeCloseTo(0.1)
    expect(rect.rect?.y).toBeCloseTo(0.2)

    const poly: Hotspot = { id:'p', hidden:false, shape:'polygon', points:[[0,0],[0.1,0.1]] }
    translateHotspot(poly, proj, 10, 0, 100, 100)
    expect(poly.points?.[0][0]).toBeCloseTo(0.1)

    const circle: Hotspot = { id:'c', hidden:false, shape:'circle', circle:{cx:0.1, cy:0.1, r:0.1} }
    translateHotspot(circle, proj, 10, 10, 100, 100)
    expect(circle.circle?.cx).toBeCloseTo(0.2)
  })

  it('modifies polygon vertices and circle radius', () => {
    const poly: Hotspot = { id:'p', hidden:false, shape:'polygon', points:[[0,0],[0.2,0]] }
    moveVertexTo(poly, proj, 1, 30, 40, 100, 100)
    expect(poly.points?.[1][0]).toBeCloseTo(0.3)
    expect(poly.points?.[1][1]).toBeCloseTo(0.4)

    insertVertex(poly, proj, 0, 10, 10, 100, 100)
    expect(poly.points).toHaveLength(3)
    expect(poly.points?.[1][0]).toBeCloseTo(0.1)

    const circle: Hotspot = { id:'c', hidden:false, shape:'circle', circle:{cx:0.1, cy:0.1, r:0.1} }
    setCircleRadius(circle, proj, 30, 10, 100, 100)
    expect(circle.circle?.r).toBeCloseTo(0.2)
  })
})
