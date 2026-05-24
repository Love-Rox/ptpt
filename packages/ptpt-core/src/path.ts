import type { Frame } from './frame'

/** Direction a cell travels through its frame ring when flipping. */
export type FlipDirection = 'forward' | 'shortest'

/**
 * Compute the sequence of frame indices a cell passes through to flip from
 * `fromSlug` to `toSlug`.
 *
 * The returned array lists every intermediate index plus the destination, in
 * flip order; the starting index is excluded. Flipping to the current frame
 * returns an empty array.
 *
 * - `forward` (default): always advance through the ring in index order,
 *   wrapping past the end. This mirrors a physical split-flap that only turns
 *   one way.
 * - `shortest`: travel whichever way around the ring is fewer flaps. Ties
 *   (exactly half-way) resolve to `forward`.
 *
 * Throws if either slug is not present in `frames`.
 */
export function computeFlipPath(
  frames: Frame[],
  fromSlug: string,
  toSlug: string,
  options?: { direction?: FlipDirection },
): number[] {
  const fromIndex = frames.findIndex((frame) => frame.slug === fromSlug)
  if (fromIndex === -1) throw new Error(`ptpt: unknown frame slug "${fromSlug}"`)
  const toIndex = frames.findIndex((frame) => frame.slug === toSlug)
  if (toIndex === -1) throw new Error(`ptpt: unknown frame slug "${toSlug}"`)

  const total = frames.length
  if (fromIndex === toIndex) return []

  const direction = options?.direction ?? 'forward'
  const forwardDistance = (toIndex - fromIndex + total) % total
  const goBackward = direction === 'shortest' && total - forwardDistance < forwardDistance

  const step = goBackward ? -1 : 1
  const out: number[] = []
  let i = fromIndex
  while (i !== toIndex) {
    i = (i + step + total) % total
    out.push(i)
  }
  return out
}
