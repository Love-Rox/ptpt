import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBoard } from '../src/board'
import { createCell } from '../src/cell'
import { image } from '../src/frame'

function mockReducedMotion(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as unknown as MediaQueryList)
}

/** N cells sharing one container, using a small A–E preset. */
function makeBoard(count: number) {
  const container = document.createElement('div')
  const cells = Array.from({ length: count }, () => {
    const el = document.createElement('div')
    container.appendChild(el)
    return createCell(el, { preset: 'ABCDE', durationPerFlap: 4 })
  })
  return { container, cells }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createBoard — a11y scaffolding', () => {
  it('annotates the common ancestor as a status region', () => {
    const { container, cells } = makeBoard(3)
    const board = createBoard(cells)
    expect(board.element).toBe(container)
    expect(container.classList.contains('ptpt-board')).toBe(true)
    expect(container.getAttribute('role')).toBe('status')
    expect(container.getAttribute('aria-live')).toBe('polite')
    expect(container.getAttribute('aria-atomic')).toBe('true')
    expect(container.getAttribute('aria-busy')).toBe('false')
    expect(container.getAttribute('aria-label')).toBe('A A A')
  })

  it('marks every cell aria-hidden', () => {
    const { cells } = makeBoard(2)
    createBoard(cells)
    for (const cell of cells) {
      expect(cell.element.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('finds the nearest common ancestor of scattered cells', () => {
    const root = document.createElement('div')
    const left = document.createElement('div')
    const right = document.createElement('div')
    root.append(left, right)
    const c1El = document.createElement('div')
    const c2El = document.createElement('div')
    left.appendChild(c1El)
    right.appendChild(c2El)
    const board = createBoard([
      createCell(c1El, { preset: 'AB' }),
      createCell(c2El, { preset: 'AB' }),
    ])
    expect(board.element).toBe(root)
  })

  it('exposes its cells in order', () => {
    const { cells } = makeBoard(3)
    const board = createBoard(cells)
    expect(board.cells).toHaveLength(3)
    expect(board.cells[0]).toBe(cells[0])
  })
})

describe('board.flipTo', () => {
  it('flips all cells from a string (sugar)', async () => {
    const { container, cells } = makeBoard(3)
    const board = createBoard(cells)
    await board.flipTo('CCC')
    expect(cells.map((c) => c.current)).toEqual(['C', 'C', 'C'])
    expect(container.getAttribute('aria-label')).toBe('C C C')
  })

  it('keeps a cell unchanged for a null target', async () => {
    const { cells } = makeBoard(3)
    const board = createBoard(cells)
    await board.flipTo(['B', null, 'D'])
    expect(cells.map((c) => c.current)).toEqual(['B', 'A', 'D'])
  })

  it('calls delayFn once per flipped cell', async () => {
    const { cells } = makeBoard(3)
    const seen: number[] = []
    const board = createBoard(cells, {
      delayFn: (index) => {
        seen.push(index)
        return index
      },
    })
    await board.flipTo('BBB')
    expect(seen).toEqual([0, 1, 2])
    expect(cells.map((c) => c.current)).toEqual(['B', 'B', 'B'])
  })
})

describe('board — announceTiming', () => {
  it('after (default): busy during, label updates only once settled', async () => {
    const { container, cells } = makeBoard(3)
    const board = createBoard(cells)
    const pending = board.flipTo('EEE')
    expect(container.getAttribute('aria-label')).toBe('A A A')
    expect(container.getAttribute('aria-busy')).toBe('true')
    await pending
    expect(container.getAttribute('aria-label')).toBe('E E E')
    expect(container.getAttribute('aria-busy')).toBe('false')
  })

  it('immediate: label updates at flip start', async () => {
    const { container, cells } = makeBoard(3)
    const board = createBoard(cells, { announceTiming: 'immediate' })
    const pending = board.flipTo('EEE')
    expect(container.getAttribute('aria-label')).toBe('E E E')
    await pending
  })

  it('after: latest target wins under rapid replace', async () => {
    const { container, cells } = makeBoard(3)
    const board = createBoard(cells)
    const p1 = board.flipTo('BBB')
    const p2 = board.flipTo('DDD')
    await Promise.all([p1, p2])
    expect(cells.map((c) => c.current)).toEqual(['D', 'D', 'D'])
    expect(container.getAttribute('aria-label')).toBe('D D D')
  })
})

describe('board — ariaLabelFormatter', () => {
  it('defaults to a space-joined frameText', async () => {
    const { container, cells } = makeBoard(3)
    createBoard(cells)
    expect(container.getAttribute('aria-label')).toBe('A A A')
  })

  it('aggregates image alt and text via a custom formatter', async () => {
    const container = document.createElement('div')
    const iconEl = document.createElement('div')
    const tempEl = document.createElement('div')
    container.append(iconEl, tempEl)
    const icon = createCell(iconEl, {
      frames: [image('sunny', '/s.svg', { alt: '晴れ' }), image('rainy', '/r.svg', { alt: '雨' })],
    })
    const temp = createCell(tempEl, { preset: '0123456789', durationPerFlap: 4 })
    const board = createBoard([icon, temp], {
      ariaLabelFormatter: (frames) => {
        const [weather, degrees] = frames
        const name = weather?.type === 'image' ? weather.alt : ''
        const value = degrees?.type === 'text' ? degrees.value : ''
        return `${name} ${value}`
      },
    })
    await board.flipTo(['sunny', '3'])
    expect(container.getAttribute('aria-label')).toBe('晴れ 3')
  })
})

describe('board — reduced motion', () => {
  it('announces immediately and never sets aria-busy', async () => {
    mockReducedMotion(true)
    const { container, cells } = makeBoard(3)
    const board = createBoard(cells)
    const pending = board.flipTo('EEE')
    expect(container.getAttribute('aria-label')).toBe('E E E')
    expect(container.getAttribute('aria-busy')).toBe('false')
    await pending
    expect(cells.map((c) => c.current)).toEqual(['E', 'E', 'E'])
  })
})

describe('board.destroy', () => {
  it('destroys cells and strips the board attributes', () => {
    const { container, cells } = makeBoard(2)
    const board = createBoard(cells)
    board.destroy()
    expect(container.classList.contains('ptpt-board')).toBe(false)
    expect(container.getAttribute('role')).toBeNull()
    expect(container.getAttribute('aria-label')).toBeNull()
    expect(cells[0]?.element.getAttribute('aria-hidden')).toBeNull()
    expect(() => cells[0]?.flipTo('B')).toThrow(/destroyed/)
  })

  it('rejects in-flight flips when destroyed', async () => {
    const container = document.createElement('div')
    const cells = [0, 1].map(() => {
      const el = document.createElement('div')
      container.appendChild(el)
      return createCell(el, { preset: 'ABCDE', durationPerFlap: 50 })
    })
    const board = createBoard(cells)
    const pending = board.flipTo('EE')
    board.destroy()
    await expect(pending).rejects.toThrow(/destroyed/)
  })
})

describe('board — robustness', () => {
  it('rejects an unknown slug without starting a flip or sticking aria-busy', async () => {
    const { container, cells } = makeBoard(3)
    const board = createBoard(cells)
    await expect(board.flipTo(['A', 'Z', 'B'])).rejects.toThrow(/unknown/)
    expect(container.getAttribute('aria-busy')).toBe('false')
    expect(cells.map((c) => c.current)).toEqual(['A', 'A', 'A'])
  })

  it('keeps aria-busy until every overlapping flip settles', async () => {
    const { container, cells } = makeBoard(3)
    const board = createBoard(cells)
    const slow = board.flipTo('EEE') // all three cells, several flaps
    const fast = board.flipTo(['B', null, null]) // only cell 0
    await fast
    // cells 1 and 2 are still animating toward E
    expect(container.getAttribute('aria-busy')).toBe('true')
    await slow
    expect(container.getAttribute('aria-busy')).toBe('false')
  })

  it('toggles aria-busy when a cell ignores reduced motion', async () => {
    mockReducedMotion(true)
    const container = document.createElement('div')
    const cells = [0, 1].map(() => {
      const el = document.createElement('div')
      container.appendChild(el)
      return createCell(el, { preset: 'ABCDE', durationPerFlap: 4, reducedMotion: 'ignore' })
    })
    const board = createBoard(cells)
    const pending = board.flipTo('CC')
    expect(container.getAttribute('aria-busy')).toBe('true')
    await pending
    expect(container.getAttribute('aria-busy')).toBe('false')
    expect(cells.map((c) => c.current)).toEqual(['C', 'C'])
  })

  it('collapses blank flaps in the default aria-label', () => {
    const container = document.createElement('div')
    const cells = [0, 1, 2].map(() => {
      const el = document.createElement('div')
      container.appendChild(el)
      return createCell(el) // default preset → starts on the blank flap
    })
    createBoard(cells)
    // three blank cells would naively join to '   '; collapsed + trimmed → ''
    expect(container.getAttribute('aria-label')).toBe('')
  })
})
