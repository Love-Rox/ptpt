import { describe, expect, it } from 'vitest'
import * as ptpt from '../src/index'

describe('public API surface', () => {
  it('exports the documented factories and functions', () => {
    for (const name of [
      'text',
      'image',
      'element',
      'frameText',
      'normalizeFrames',
      'computeFlipPath',
      'createCell',
      'createBoard',
    ] as const) {
      expect(typeof ptpt[name]).toBe('function')
    }
  })

  it('exposes presets and delays namespaces', () => {
    expect(ptpt.presets.default.name).toBe('default')
    expect(ptpt.presets.digits.chars).toBe(' 0123456789')
    expect(typeof ptpt.delays.uniform).toBe('function')
    expect(typeof ptpt.delays.wave).toBe('function')
  })

  it('works end to end through the public entry point', async () => {
    const container = document.createElement('div')
    const cells = ['0', '0'].map(() => {
      const el = document.createElement('div')
      container.appendChild(el)
      return ptpt.createCell(el, { preset: ptpt.presets.digits, durationPerFlap: 2 })
    })
    const board = ptpt.createBoard(cells, { delayFn: ptpt.delays.uniform() })
    await board.flipTo('42')
    expect(cells.map((c) => c.current)).toEqual(['4', '2'])
    expect(container.getAttribute('aria-label')).toBe('4 2')
  })
})
