/**
 * Per-cell start delay (ms) for a board flip, given the cell's index and the
 * total cell count. Used to stagger cells (waves, ripples, randomness).
 */
export type DelayFn = (index: number, total: number) => number
