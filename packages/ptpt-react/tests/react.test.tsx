import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Patapata } from '../src/Patapata'
import { PatapataBoard } from '../src/PatapataBoard'
import { useFlipCell } from '../src/useFlipCell'

afterEach(cleanup)

describe('<Patapata>', () => {
  it('builds a cell and flips to the target', async () => {
    const onFlipComplete = vi.fn()
    const { container } = render(
      <Patapata preset="ABCDE" durationPerFlap={2} target="C" onFlipComplete={onFlipComplete} />,
    )
    expect(container.querySelector('.ptpt-cell')).toBeTruthy()
    await waitFor(() => {
      expect(container.querySelector('.ptpt-top .glyph')?.textContent).toBe('C')
    })
    expect(onFlipComplete).toHaveBeenCalled()
  })

  it('flips again when the target prop changes', async () => {
    const { container, rerender } = render(
      <Patapata preset="ABCDE" durationPerFlap={2} target="B" />,
    )
    await waitFor(() => {
      expect(container.querySelector('.ptpt-top .glyph')?.textContent).toBe('B')
    })
    rerender(<Patapata preset="ABCDE" durationPerFlap={2} target="E" />)
    await waitFor(() => {
      expect(container.querySelector('.ptpt-top .glyph')?.textContent).toBe('E')
    })
  })
})

describe('<PatapataBoard>', () => {
  it('renders one cell per target and announces the result', async () => {
    const { container } = render(
      <PatapataBoard cellOptions={{ preset: '0123456789', durationPerFlap: 2 }} targets="42" />,
    )
    const board = container.querySelector('[role="status"]')
    expect(board).toBeTruthy()
    expect(container.querySelectorAll('.ptpt-cell')).toHaveLength(2)
    await waitFor(() => {
      expect(board?.getAttribute('aria-label')).toBe('4 2')
    })
  })
})

describe('useFlipCell', () => {
  function Demo() {
    const { ref, flipTo, current } = useFlipCell({ preset: 'ABCDE', durationPerFlap: 2 })
    return (
      <div>
        <div data-testid="host" ref={ref} />
        <span data-testid="current">{current}</span>
        <button type="button" onClick={() => flipTo('D')}>
          go
        </button>
      </div>
    )
  }

  it('exposes a ref and imperative flipTo', async () => {
    const { getByTestId, getByText } = render(<Demo />)
    await waitFor(() => {
      expect(getByTestId('current').textContent).toBe('A')
    })
    fireEvent.click(getByText('go'))
    await waitFor(() => {
      expect(getByTestId('current').textContent).toBe('D')
    })
  })
})
