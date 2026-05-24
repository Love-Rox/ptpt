import { describe, expect, it } from 'vitest'
import { random, uniform, wave } from '../src/delays'

describe('uniform', () => {
  it('always returns 0', () => {
    const fn = uniform()
    expect(fn(0, 5)).toBe(0)
    expect(fn(4, 5)).toBe(0)
  })
})

describe('random', () => {
  it('returns values within [0, maxMs)', () => {
    const fn = random(100)
    for (let i = 0; i < 1000; i++) {
      const value = fn(i, 1000)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(100)
    }
  })
})

describe('wave', () => {
  it('increments by step left-to-right', () => {
    const fn = wave({ direction: 'ltr', step: 50 })
    expect(fn(0, 5)).toBe(0)
    expect(fn(2, 5)).toBe(100)
    expect(fn(4, 5)).toBe(200)
  })

  it('reverses the ramp right-to-left', () => {
    const fn = wave({ direction: 'rtl', step: 50 })
    expect(fn(0, 5)).toBe(200)
    expect(fn(4, 5)).toBe(0)
  })

  it('defaults to ltr with step 50', () => {
    const fn = wave({})
    expect(fn(0, 5)).toBe(0)
    expect(fn(3, 5)).toBe(150)
  })
})
