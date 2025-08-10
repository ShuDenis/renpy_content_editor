import { describe, it, expect } from 'vitest'
import { validateDialogProject, emptyDialogProject } from './dialogSchema'

describe('dialogSchema', () => {
  it('validates a correct project', () => {
    const input = { version: '1.0', dialogs: [{ id: 'dlg_1', nodes: [] }] }
    expect(validateDialogProject(input)).toEqual(input)
  })

  it('provides defaults', () => {
    const result = validateDialogProject({})
    expect(result.dialogs[0].id).toBe('dlg_1')
  })

  it('creates empty dialog project', () => {
    const proj = emptyDialogProject()
    expect(proj.dialogs).toHaveLength(1)
  })

  it('rejects invalid data', () => {
    expect(() => validateDialogProject({ version: 1 })).toThrow()
  })
})
