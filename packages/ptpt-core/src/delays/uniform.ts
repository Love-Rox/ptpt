import type { DelayFn } from './_types'

/**
 * No stagger: every cell starts at the same time.
 *
 * @returns A {@link DelayFn} that always returns `0`.
 *
 * @example
 * ```ts
 * createBoard(cells, { delayFn: uniform() })
 * ```
 */
export const uniform = (): DelayFn => () => 0
