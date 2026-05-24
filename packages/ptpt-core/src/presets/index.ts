import { alphaPreset } from './alpha'
import { alphanumericPreset } from './alphanumeric'
import { defaultPreset } from './default'
import { digitsPreset } from './digits'

export type { PresetDefinition } from './_types'
export { alphaPreset } from './alpha'
export { alphanumericPreset } from './alphanumeric'
export { defaultPreset } from './default'
export { digitsPreset } from './digits'

/** All built-in presets, keyed by name. */
export const presets = {
  default: defaultPreset,
  alphanumeric: alphanumericPreset,
  digits: digitsPreset,
  alpha: alphaPreset,
} as const
