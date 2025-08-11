import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HotspotInspector from './HotspotInspector'
import { HotspotContext } from './HotspotContext'
import type { Hotspot } from '@core/sceneSchema'

describe('HotspotInspector', () => {
  it('shows error for invalid expression', () => {
    const hs: Hotspot = { id: 'h1', shape: 'rect', rect: { x: 0, y: 0, w: 1, h: 1 }, hidden: false }
    const setHs = vi.fn()
    render(
      <HotspotContext.Provider value={{ hotspot: hs, setHotspot: setHs }}>
        <HotspotInspector />
      </HotspotContext.Provider>
    )
    const input = screen.getByLabelText('visible_if') as HTMLInputElement
    fireEvent.change(input, { target: { value: '(' } })
    expect(screen.getByText(/Invalid expression/)).toBeInTheDocument()
    expect(setHs).not.toHaveBeenCalled()
  })
})
