import { describe, it, expect, vi } from 'vitest'
import {
  projectToCanvasScalar,
  canvasToProjectScalar,
  projectToCanvasPoint,
  canvasToProjectPoint,
  loadFileAsText,
  saveTextFile
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
})

describe('file helpers', () => {
  it('reads text from selected file', async () => {
    const content = 'hello world'
    const file = new File([content], 'test.txt', { type: 'text/plain' })

    const input: any = {
      type: '', accept: '', files: [file], onchange: null,
      click: () => input.onchange && input.onchange()
    }
    const originalCreateElement = document.createElement
    // @ts-ignore override
    document.createElement = vi.fn((tag: string) => tag === 'input' ? input : originalCreateElement.call(document, tag))

    class FR {
      result: string | ArrayBuffer | null = null
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null
      readAsText(f: File) {
        this.result = content
        this.onload && this.onload(new ProgressEvent('load'))
      }
    }
    // @ts-ignore override
    global.FileReader = FR

    const text = await loadFileAsText('.txt')
    expect(text).toBe(content)

    document.createElement = originalCreateElement
  })

  it('triggers download when saving text', () => {
    const click = vi.fn()
    const anchor: any = { href: '', download: '', click }
    const originalCreate = document.createElement
    // @ts-ignore
    document.createElement = vi.fn((tag: string) => tag === 'a' ? anchor : originalCreate(tag))

    const createURL = vi.fn(() => 'blob:url')
    const revokeURL = vi.fn()
    // @ts-ignore
    global.URL.createObjectURL = createURL
    // @ts-ignore
    global.URL.revokeObjectURL = revokeURL

    saveTextFile('data', 'file.txt')

    expect(createURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revokeURL).toHaveBeenCalled()

    document.createElement = originalCreate
  })
})
