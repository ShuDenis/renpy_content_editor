import { describe, it, expect } from 'vitest'
import { validateSceneProject, emptyProject } from './sceneSchema'

describe('sceneSchema', () => {
  const base = {
    version: '1.0',
    project: { reference_resolution: { width: 100, height: 50 }, coords_mode: 'relative' as const },
    scenes: []
  }

  it('validates a correct project', () => {
    expect(validateSceneProject(base)).toEqual(base)
  })

  it('provides defaults', () => {
    const result = validateSceneProject({ project: { reference_resolution: { width: 100, height: 50 } }, scenes: [] })
    expect(result.project.coords_mode).toBe('relative')
  })

  it('creates empty project', () => {
    const proj = emptyProject()
    expect(proj.project.reference_resolution.width).toBe(1920)
  })

  it('rejects invalid data', () => {
    // @ts-expect-error testing invalid
    expect(() => validateSceneProject({ project: {} })).toThrow()
  })
})
