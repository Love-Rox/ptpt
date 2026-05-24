import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCell } from '../src/cell'
import { element, image } from '../src/frame'
import { digitsPreset } from '../src/presets/digits'

function host(): HTMLElement {
  return document.createElement('div')
}

/** Force `prefers-reduced-motion: reduce` on/off for a test. */
function mockReducedMotion(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as unknown as MediaQueryList)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createCell — setup', () => {
  it('builds the 3-element DOM structure', () => {
    const el = host()
    createCell(el, { preset: 'AB' })
    expect(el.classList.contains('ptpt-cell')).toBe(true)
    expect(el.querySelectorAll('.ptpt-half')).toHaveLength(3)
    expect(el.querySelector('.ptpt-top-preview .glyph')).toBeTruthy()
    expect(el.querySelector('.ptpt-top .glyph')).toBeTruthy()
    expect(el.querySelector('.ptpt-bottom .glyph')).toBeTruthy()
  })

  it('defaults to the default preset (leading blank)', () => {
    const cell = createCell(host())
    expect(cell.current).toBe(' ')
  })

  it('renders the first frame into all halves', () => {
    const el = host()
    createCell(el, { preset: 'XY' })
    expect(el.querySelector('.ptpt-top .glyph')?.textContent).toBe('X')
    expect(el.querySelector('.ptpt-bottom .glyph')?.textContent).toBe('X')
    expect(el.querySelector('.ptpt-top-preview .glyph')?.textContent).toBe('X')
  })

  it('throws when preset and frames are both given', () => {
    expect(() => createCell(host(), { preset: 'AB', frames: ['A'] })).toThrow(/mutually exclusive/)
  })

  it('throws when there are no frames', () => {
    expect(() => createCell(host(), { frames: [] })).toThrow(/at least one frame/)
  })

  it('uses the preset recommendedDuration as the flip-duration default', () => {
    const el = host()
    createCell(el, { preset: digitsPreset })
    expect(el.style.getPropertyValue('--ptpt-flip-duration')).toBe('200ms')
  })

  it('lets an explicit durationPerFlap win over the preset', () => {
    const el = host()
    createCell(el, { preset: digitsPreset, durationPerFlap: 40 })
    expect(el.style.getPropertyValue('--ptpt-flip-duration')).toBe('40ms')
  })
})

describe('createCell — rendering frame types', () => {
  it('renders an image frame as <img> with alt', () => {
    const el = host()
    createCell(el, { frames: [image('sun', '/sun.png', { alt: '太陽' }), 'A'] })
    const img = el.querySelector('.ptpt-top .glyph img')
    expect(img?.getAttribute('src')).toBe('/sun.png')
    expect(img?.getAttribute('alt')).toBe('太陽')
  })

  it('falls back to slug for an image with no alt and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const el = host()
    createCell(el, { frames: [image('sun', '/sun.png'), 'A'] })
    expect(el.querySelector('.ptpt-top .glyph img')?.getAttribute('alt')).toBe('sun')
    expect(warn).toHaveBeenCalled()
  })

  it('renders an element frame by cloning the node', () => {
    const node = document.createElement('span')
    node.textContent = 'hi'
    const el = host()
    createCell(el, { frames: [element('e', node), 'A'] })
    expect(el.querySelector('.ptpt-top .glyph span')?.textContent).toBe('hi')
  })
})

describe('cell.flipTo', () => {
  it('flips to the target and resolves with the new current', async () => {
    const el = host()
    const cell = createCell(el, { preset: 'ABCDE', durationPerFlap: 4 })
    await cell.flipTo('C')
    expect(cell.current).toBe('C')
    expect(el.querySelector('.ptpt-top .glyph')?.textContent).toBe('C')
  })

  it('honors the shortest direction', async () => {
    const cell = createCell(host(), { preset: 'ABCDE', durationPerFlap: 2, direction: 'shortest' })
    await cell.flipTo('D') // A → D the short way (via E)
    expect(cell.current).toBe('D')
  })

  it('throws synchronously on an unknown slug', () => {
    const cell = createCell(host(), { preset: 'ABC' })
    expect(() => cell.flipTo('Z')).toThrow(/unknown/)
  })
})

describe('cell.flipTo — replace mode (default)', () => {
  it('coalesces rapid calls and settles at the latest target', async () => {
    const cell = createCell(host(), { preset: 'ABCDE', durationPerFlap: 4 })
    const p1 = cell.flipTo('C')
    const p2 = cell.flipTo('E')
    await Promise.all([p1, p2])
    expect(cell.current).toBe('E')
  })
})

describe('cell.flipTo — queue mode', () => {
  it('runs queued targets in order, each resolving at its own target', async () => {
    const cell = createCell(host(), { preset: 'ABCDE', durationPerFlap: 4 })
    const seen: string[] = []
    const p1 = cell.flipTo('B', { mode: 'queue' }).then(() => seen.push(cell.current))
    const p2 = cell.flipTo('D', { mode: 'queue' }).then(() => seen.push(cell.current))
    await Promise.all([p1, p2])
    expect(seen).toEqual(['B', 'D'])
  })
})

describe('cell — reduced motion', () => {
  it('instant jumps straight to the target when reduce is preferred', async () => {
    mockReducedMotion(true)
    const el = host()
    const cell = createCell(el, { preset: 'ABCDE', reducedMotion: 'instant', durationPerFlap: 50 })
    await cell.flipTo('D')
    expect(cell.current).toBe('D')
    expect(el.classList.contains('flipping')).toBe(false)
  })

  it('minimal still settles at the target when reduce is preferred', async () => {
    mockReducedMotion(true)
    const cell = createCell(host(), {
      preset: 'ABCDE',
      reducedMotion: 'minimal',
      durationPerFlap: 4,
    })
    await cell.flipTo('D')
    expect(cell.current).toBe('D')
  })

  it('ignore animates normally even when reduce is preferred', async () => {
    mockReducedMotion(true)
    const cell = createCell(host(), {
      preset: 'ABCDE',
      reducedMotion: 'ignore',
      durationPerFlap: 4,
    })
    await cell.flipTo('C')
    expect(cell.current).toBe('C')
  })
})

describe('cell.destroy', () => {
  it('rejects an in-flight flip and tears down the DOM', async () => {
    const el = host()
    const cell = createCell(el, { preset: 'ABCDE', durationPerFlap: 50 })
    const pending = cell.flipTo('E')
    cell.destroy()
    await expect(pending).rejects.toThrow(/destroyed/)
    expect(el.classList.contains('ptpt-cell')).toBe(false)
    expect(el.querySelectorAll('.ptpt-half')).toHaveLength(0)
  })

  it('throws when flipTo is called after destroy', () => {
    const cell = createCell(host(), { preset: 'ABC' })
    cell.destroy()
    expect(() => cell.flipTo('B')).toThrow(/destroyed/)
  })
})
