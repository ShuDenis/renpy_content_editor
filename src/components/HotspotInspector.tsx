import React, { useEffect, useState } from "react"
import { Hotspot, HotspotSchema } from "@lib/sceneSchema"
import { useHotspot } from "./HotspotContext"

type Action = NonNullable<Hotspot['action']>
type ActionType = Action['type']

type Tab = 'basic' | 'actions' | 'transitions'

export default function HotspotInspector() {
  const { hotspot, setHotspot } = useHotspot()
  const [tab, setTab] = useState<Tab>('basic')
  const [form, setForm] = useState<Hotspot>(hotspot)
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(() => {
    setForm(hotspot)
    setErrors({})
  }, [hotspot])

  function update(part: Partial<Hotspot>) {
    const next = { ...form, ...part }
    setForm(next)
    const parsed = HotspotSchema.safeParse(next)
    if (parsed.success) {
      setErrors({})
      setHotspot(parsed.data)
    } else {
      const err: Record<string,string> = {}
      for (const issue of parsed.error.issues) {
        err[issue.path.join('.')] = issue.message
      }
      setErrors(err)
    }
  }

  function updateAction(action: Hotspot['action']) {
    update({ action })
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button onClick={() => setTab('basic')} style={{ fontWeight: tab === 'basic' ? 600 : 400 }}>Основные</button>
        <button onClick={() => setTab('actions')} style={{ fontWeight: tab === 'actions' ? 600 : 400 }}>Действия</button>
        <button onClick={() => setTab('transitions')} style={{ fontWeight: tab === 'transitions' ? 600 : 400 }}>Переходы</button>
      </div>
      {tab === 'basic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>tooltip
            <input value={form.tooltip || ''} onChange={e => update({ tooltip: e.target.value || undefined })} />
          </label>
          <label>visible_if
            <input value={form.visible_if || ''} onChange={e => update({ visible_if: e.target.value || undefined })} />
          </label>
          {errors['visible_if'] && <div style={{ color: 'red' }}>{errors['visible_if']}</div>}
          <label>enabled_if
            <input value={form.enabled_if || ''} onChange={e => update({ enabled_if: e.target.value || undefined })} />
          </label>
          {errors['enabled_if'] && <div style={{ color: 'red' }}>{errors['enabled_if']}</div>}
        </div>
      )}
      {tab === 'actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>action
            <select value={form.action?.type || ''} onChange={e => {
              const type = e.target.value as ActionType | ''
              let action: Hotspot['action'] | undefined
              switch (type) {
                case 'go_scene':
                  action = { type, scene_id: '' }
                  break
                case 'jump_label':
                  action = { type, label: '' }
                  break
                case 'call_label':
                  action = { type, label: '' }
                  break
                case 'call_screen':
                  action = { type, screen: '' }
                  break
                case 'function':
                  action = { type, name: '' }
                  break
                default:
                  action = undefined
              }
              update({ action })
            }}>
              <option value="">none</option>
              <option value="go_scene">go_scene</option>
              <option value="jump_label">jump_label</option>
              <option value="call_label">call_label</option>
              <option value="call_screen">call_screen</option>
              <option value="function">function</option>
            </select>
          </label>
          {form.action?.type === 'go_scene' && (
            <label>scene_id
              <input value={form.action.scene_id} onChange={e => {
                if (form.action?.type !== 'go_scene') return
                updateAction({ ...form.action, scene_id: e.target.value })
              }} />
            </label>
          )}
          {form.action?.type === 'jump_label' && (
            <label>label
              <input value={form.action.label} onChange={e => {
                if (form.action?.type !== 'jump_label') return
                updateAction({ ...form.action, label: e.target.value })
              }} />
            </label>
          )}
          {form.action?.type === 'call_label' && (
            <label>label
              <input value={form.action.label} onChange={e => {
                if (form.action?.type !== 'call_label') return
                updateAction({ ...form.action, label: e.target.value })
              }} />
            </label>
          )}
          {form.action?.type === 'call_screen' && (
            <label>screen
              <input value={form.action.screen} onChange={e => {
                if (form.action?.type !== 'call_screen') return
                updateAction({ ...form.action, screen: e.target.value })
              }} />
            </label>
          )}
          {form.action?.type === 'function' && (
            <label>name
              <input value={form.action.name} onChange={e => {
                if (form.action?.type !== 'function') return
                updateAction({ ...form.action, name: e.target.value })
              }} />
            </label>
          )}
        </div>
      )}
      {tab === 'transitions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {form.action?.type === 'go_scene' ? (
            <>
              <label>type
                <input value={form.action.transition?.type || ''} onChange={e => {
                  if (form.action?.type !== 'go_scene') return
                  const tr = { ...(form.action.transition || {}), type: e.target.value }
                  updateAction({ ...form.action, transition: tr })
                }} />
              </label>
              <label>duration
                <input type="number" value={form.action.transition?.duration ?? ''} onChange={e => {
                  if (form.action?.type !== 'go_scene') return
                  const d = e.target.value
                  const duration = d === '' ? undefined : parseFloat(d)
                  const tr = { ...(form.action.transition || { type: '' }), duration, easing: form.action.transition?.easing }
                  updateAction({ ...form.action, transition: tr })
                }} />
              </label>
              {errors['action.transition.duration'] && <div style={{ color: 'red' }}>{errors['action.transition.duration']}</div>}
              <label>easing
                <input value={form.action.transition?.easing || ''} onChange={e => {
                  if (form.action?.type !== 'go_scene') return
                  const tr = { ...(form.action.transition || { type: '' }), easing: e.target.value }
                  updateAction({ ...form.action, transition: tr })
                }} />
              </label>
            </>
          ) : (
            <div>Нет переходов для этого действия</div>
          )}
        </div>
      )}
    </div>
  )
}
