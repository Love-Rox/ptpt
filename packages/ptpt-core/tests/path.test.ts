import { describe, expect, it } from 'vitest'
import { normalizeFrames } from '../src/normalize'
import { computeFlipPath } from '../src/path'

// A B C D E  →  indices 0 1 2 3 4
const frames = normalizeFrames([...'ABCDE'])

describe('computeFlipPath', () => {
  it('walks forward through intermediate indices', () => {
    expect(computeFlipPath(frames, 'A', 'C')).toEqual([1, 2])
  })

  it('returns an empty path when from equals to', () => {
    expect(computeFlipPath(frames, 'C', 'C')).toEqual([])
  })

  it('wraps around the end when flipping forward', () => {
    expect(computeFlipPath(frames, 'D', 'B')).toEqual([4, 0, 1])
  })

  it('shortest goes forward when forward is shorter', () => {
    expect(computeFlipPath(frames, 'A', 'B', { direction: 'shortest' })).toEqual([1])
  })

  it('shortest goes backward when backward is shorter', () => {
    // A(0) → D(3): forward = 3, backward = 2 → backward via E(4)
    expect(computeFlipPath(frames, 'A', 'D', { direction: 'shortest' })).toEqual([4, 3])
  })

  it('shortest resolves ties to forward', () => {
    const ring = normalizeFrames([...'ABCD'])
    // A(0) → C(2): forward = 2, backward = 2 → forward
    expect(computeFlipPath(ring, 'A', 'C', { direction: 'shortest' })).toEqual([1, 2])
  })

  it('defaults to forward direction', () => {
    expect(computeFlipPath(frames, 'A', 'D')).toEqual(
      computeFlipPath(frames, 'A', 'D', { direction: 'forward' }),
    )
  })

  it('throws when the source slug is unknown', () => {
    expect(() => computeFlipPath(frames, 'Z', 'A')).toThrow(/unknown/)
  })

  it('throws when the destination slug is unknown', () => {
    expect(() => computeFlipPath(frames, 'A', 'Z')).toThrow(/unknown/)
  })
})
