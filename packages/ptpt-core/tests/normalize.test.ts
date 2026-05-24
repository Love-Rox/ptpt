import { describe, expect, it } from 'vitest'
import { image, text } from '../src/frame'
import { normalizeFrames } from '../src/normalize'

describe('normalizeFrames', () => {
  it('converts bare strings to text frames', () => {
    expect(normalizeFrames(['A', 'B'])).toEqual([
      { slug: 'A', type: 'text', value: 'A' },
      { slug: 'B', type: 'text', value: 'B' },
    ])
  })

  it('treats path-like strings as text, not images', () => {
    expect(normalizeFrames(['/sun.png'])).toEqual([
      { slug: '/sun.png', type: 'text', value: '/sun.png' },
    ])
  })

  it('passes frame objects through unchanged', () => {
    const img = image('sun', '/sun.png', { alt: '太陽' })
    expect(normalizeFrames(['A', img])).toEqual([text('A'), img])
  })

  it('throws on duplicate slugs', () => {
    expect(() => normalizeFrames(['A', 'A'])).toThrow(/duplicate/)
  })

  it('throws when a string collides with an explicit frame slug', () => {
    expect(() => normalizeFrames(['A', text('A', 'B')])).toThrow(/duplicate/)
  })

  it('returns an empty array for empty input', () => {
    expect(normalizeFrames([])).toEqual([])
  })
})
