/**
 * A named, ordered set of flaps. Presets are the "batteries included" frame
 * sets and the unit communities extend (one preset = one file).
 */
export type PresetDefinition = {
  /** Identifier, e.g. `'default'`, `'digits'`. */
  name: string
  /** Flap order as a string; each code point is one flap. */
  chars: string
  /** Where the set comes from and what it is for. */
  description: string
  /** Suggested `durationPerFlap` (ms) for this set. */
  recommendedDuration?: number
  /** Suggested `lang` value for a11y. */
  locale?: string
}
