import type { DelayFn } from './_types'

/**
 * Stagger cells in sequence so the flip sweeps across the board like a wave.
 *
 * @param options - Wave configuration.
 * @param options.direction - Sweep direction: `'ltr'` (default) delays later
 *   cells more; `'rtl'` delays earlier cells more.
 * @param options.step - Delay added per cell, in milliseconds. Default `50`.
 * @returns A {@link DelayFn} whose delay grows linearly along the sweep.
 *
 * @example
 * ```ts
 * createBoard(cells, { delayFn: wave({ direction: 'ltr', step: 50 }) })
 * ```
 */
export const wave = (options: { direction?: 'ltr' | 'rtl'; step?: number }): DelayFn => {
  const { direction = 'ltr', step = 50 } = options
  return (index, total) => (direction === 'ltr' ? index : total - 1 - index) * step
}
