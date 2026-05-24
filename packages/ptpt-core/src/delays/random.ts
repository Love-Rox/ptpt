import type { DelayFn } from './_types'

/**
 * Scatter each cell's start by a random amount, for a "snow" / shuffle feel.
 *
 * @param maxMs - Upper bound (exclusive) of the random delay in milliseconds.
 * @returns A {@link DelayFn} returning a value in `[0, maxMs)`.
 *
 * @example
 * ```ts
 * createBoard(cells, { delayFn: random(300) })
 * ```
 */
export const random =
  (maxMs: number): DelayFn =>
  () =>
    Math.random() * maxMs
