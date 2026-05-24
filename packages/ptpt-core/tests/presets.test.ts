import { describe, expect, it } from 'vitest'
import {
  alphanumericPreset,
  alphaPreset,
  defaultPreset,
  digitsPreset,
  presets,
} from '../src/presets'

describe('presets', () => {
  it('default preset matches the prototype char set', () => {
    expect(defaultPreset.name).toBe('default')
    expect(defaultPreset.chars).toBe(' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;\'"-+/?!&@#$%*')
    expect([...defaultPreset.chars]).toHaveLength(54)
  })

  it('digits preset is blank + 0-9', () => {
    expect(digitsPreset.chars).toBe(' 0123456789')
    expect([...digitsPreset.chars]).toHaveLength(11)
  })

  it('alpha preset is blank + A-Z', () => {
    expect(alphaPreset.chars).toBe(' ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    expect([...alphaPreset.chars]).toHaveLength(27)
  })

  it('alphanumeric preset is blank + A-Z + 0-9', () => {
    expect(alphanumericPreset.chars).toBe(' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    expect([...alphanumericPreset.chars]).toHaveLength(37)
  })

  it('presets object maps names to definitions', () => {
    expect(presets.default).toBe(defaultPreset)
    expect(presets.alphanumeric).toBe(alphanumericPreset)
    expect(presets.digits).toBe(digitsPreset)
    expect(presets.alpha).toBe(alphaPreset)
  })

  it('each preset name matches its key', () => {
    for (const [key, preset] of Object.entries(presets)) {
      expect(preset.name).toBe(key)
    }
  })
})
