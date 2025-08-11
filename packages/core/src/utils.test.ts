import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  projectToCanvasScalar,
  canvasToProjectScalar,
  projectToCanvasPoint,
  canvasToProjectPoint,
  loadFileAsText,
  saveTextFile,
  round3,
  convertProjectCoordsMode
} from './utils'
import type { SceneProject } from './sceneSchema'

describe('coordinate helpers', () => {
  const proj: SceneProject = {
    version: '1.0',
    project: { reference_resolution: { width: 100, height: 100 }, coords_mode: 'relative' },
    scenes: []
  }

  it('converts scalars between project and canvas', () => {
    expect(projectToCanvasScalar(proj, 0.5, 200, 100)).toBe(100)
    expect(canvasToProjectScalar(proj, 100, 200, 100)).toBeCloseTo(0.5)

    const abs: SceneProject = { ...proj, project: { ...proj.project, coords_mode: 'absolute' } }
    expect(projectToCanvasScalar(abs, 50, 200, 100)).toBe(100)
    expect(canvasToProjectScalar(abs, 100, 200, 100)).toBe(50)
  })

  it('converts points between project and canvas', () => {
    const pt = projectToCanvasPoint(proj, 0.5, 0.25, 200, 200)
    expect(pt).toEqual({ x: 100, y: 50 })
    const back = canvasToProjectPoint(proj, 100, 50, 200, 200)
    expect(back.x).toBeCloseTo(0.5)
    expect(back.y).toBeCloseTo(0.25)
  })

  it('rounds numbers to 3 decimals', () => {
    expect(round3(0.123456)).toBe(0.123)
    expect(round3(0.1235)).toBe(0.124)
  })

  it('converts project coordinate modes', () => {
    const src: SceneProject = {
      version: '1.0',
      project: { reference_resolution: { width: 100, height: 100 }, coords_mode: 'relative' },
      scenes: [{
        id: 's',
        layers: [],
        hotspots: [{
          id: 'h',
          hidden: false,
          shape: 'rect',
          rect: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 }
        }]
      }]
    }
    const abs = convertProjectCoordsMode(src, 'absolute')
    expect(abs.project.coords_mode).toBe('absolute')
    expect(abs.scenes[0].hotspots[0].rect!.w).toBe(30)
    const back = convertProjectCoordsMode(abs, 'relative')
    expect(back.project.coords_mode).toBe('relative')
    expect(back.scenes[0].hotspots[0].rect!.w).toBeCloseTo(0.3)
  })
})

describe('file helpers', () => {
  const originalCreateElement = document.createElement
  const originalFileReader = globalThis.FileReader
  const originalCreateObjectURL = globalThis.URL.createObjectURL
  const originalRevokeObjectURL = globalThis.URL.revokeObjectURL

  afterEach(() => {
    document.createElement = originalCreateElement
    globalThis.FileReader = originalFileReader
    globalThis.URL.createObjectURL = originalCreateObjectURL
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('reads text from selected file', async () => {
    const content = 'hello world'
    const file = new File([content], 'test.txt', { type: 'text/plain' })

    const remove = vi.fn()
    const input: any = {
      type: '', accept: '', files: [file], onchange: null,
      click: () => input.onchange && input.onchange(),
      remove
    }
    // @ts-ignore override
    document.createElement = vi.fn((tag: string) => tag === 'input' ? input : originalCreateElement.call(document, tag))

    class FR {
      result: string | ArrayBuffer | null = null
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
      readAsText(_f: File) {
        this.result = content
        // call onload with correct `this` context to satisfy TS
        this.onload?.call(
          this as unknown as FileReader,
          new ProgressEvent('load') as ProgressEvent<FileReader>
        )
      }
    }
    // @ts-ignore override
    globalThis.FileReader = FR

    const text = await loadFileAsText('.txt')
    expect(text).toBe(content)
    expect(remove).toHaveBeenCalled()

    document.createElement = originalCreateElement
  })

  it('returns null and removes element when no file selected', async () => {
    const remove = vi.fn()
    const input: any = {
      type: '', accept: '', files: [], onchange: null,
      click: () => input.onchange && input.onchange(),
      remove
    }
    // @ts-ignore override
    document.createElement = vi.fn((tag: string) => tag === 'input' ? input : originalCreateElement.call(document, tag))

    const text = await loadFileAsText('.txt')
    expect(text).toBeNull()
    expect(remove).toHaveBeenCalled()

    document.createElement = originalCreateElement
  })

  it('triggers download when saving text', () => {
    const click = vi.fn()
    const remove = vi.fn()
    const anchor: any = { href: '', download: '', click, remove }
    const originalCreate = document.createElement

    // @ts-ignore
    document.createElement = vi.fn((tag: string) => tag === 'a' ? anchor : originalCreateElement.call(document, tag))

    const createURL = vi.fn(() => 'blob:url')
    const revokeURL = vi.fn()
    // @ts-ignore
    globalThis.URL.createObjectURL = createURL
    // @ts-ignore
    globalThis.URL.revokeObjectURL = revokeURL

    saveTextFile('data', 'file.txt')

    expect(createURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(remove).toHaveBeenCalled()
    expect(revokeURL).toHaveBeenCalled()
  })
})
