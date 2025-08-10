import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HotspotPanel from './HotspotPanel'

describe('HotspotPanel', () => {
  it('calls callbacks when buttons clicked', () => {
    const rect = vi.fn()
    const poly = vi.fn()
    const circle = vi.fn()
    const { getByText } = render(<HotspotPanel onAddRect={rect} onAddPolygon={poly} onAddCircle={circle} />)
    fireEvent.click(getByText('+ Rect'))
    fireEvent.click(getByText('+ Polygon'))
    fireEvent.click(getByText('+ Circle'))
    expect(rect).toHaveBeenCalled()
    expect(poly).toHaveBeenCalled()
    expect(circle).toHaveBeenCalled()
  })
})
