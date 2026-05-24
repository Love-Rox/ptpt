import { type Frame, type FrameInput, text } from './frame'

/**
 * Normalize an array of {@link FrameInput} into {@link Frame}s.
 *
 * - Bare strings become text frames (always text, even if they look like a path).
 * - Frame objects pass through unchanged.
 * - Throws if two frames share a slug (slugs must be unique within a set).
 *
 * @param inputs - The raw frame inputs to normalize.
 * @returns The normalized, slug-unique frames in their original order.
 * @throws If any slug appears more than once.
 */
export function normalizeFrames(inputs: FrameInput[]): Frame[] {
  const frames = inputs.map((input) => (typeof input === 'string' ? text(input) : input))

  const seen = new Set<string>()
  for (const frame of frames) {
    if (seen.has(frame.slug)) {
      throw new Error(`ptpt: duplicate frame slug "${frame.slug}"`)
    }
    seen.add(frame.slug)
  }

  return frames
}
