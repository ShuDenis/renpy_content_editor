import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@components/ScenesEditor', () => ({ default: () => <div data-testid="scenes" /> }))
vi.mock('@components/DialogEditor', () => ({ default: () => <div data-testid="dialogs" /> }))

import App from './App'

describe('App', () => {
  it('switches between editors', () => {
    render(<App />)
    expect(screen.getByTestId('scenes')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Диалоги'))
    expect(screen.getByTestId('dialogs')).toBeInTheDocument()
  })
})
