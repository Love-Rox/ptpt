/**
 * A single frame ("flap") shown by a cell. One of text, image, or element.
 */
export type Frame = TextFrame | ImageFrame | ElementFrame

/** Text flap. `value` is what is rendered; `slug` identifies it. */
export type TextFrame = { slug: string; type: 'text'; value: string }

/** Image flap rendered with an `<img>`. */
export type ImageFrame = {
  slug: string
  type: 'image'
  src: string
  alt?: string
  width?: number
  height?: number
}

/** Escape hatch: an arbitrary element cloned into the cell. */
export type ElementFrame = { slug: string; type: 'element'; node: HTMLElement }

/** Accepted as frame input; a bare string is normalized into a {@link TextFrame}. */
export type FrameInput = string | Frame

/**
 * Create a text frame.
 *
 * - `text(value)` uses `value` as both the slug and the rendered value.
 * - `text(slug, value)` sets the slug explicitly (e.g. distinguishing two
 *   frames that render the same glyph).
 *
 * @param slugOrValue - The slug when a second argument is given, otherwise the
 *   value (which also becomes the slug).
 * @param value - The rendered value, when an explicit slug is provided.
 * @returns A {@link TextFrame}.
 *
 * @example
 * ```ts
 * text('A')              // { slug: 'A', type: 'text', value: 'A' }
 * text('a-red', 'A')     // { slug: 'a-red', type: 'text', value: 'A' }
 * ```
 */
export function text(value: string): TextFrame
export function text(slug: string, value: string): TextFrame
export function text(slugOrValue: string, value?: string): TextFrame {
  return value === undefined
    ? { slug: slugOrValue, type: 'text', value: slugOrValue }
    : { slug: slugOrValue, type: 'text', value }
}

/**
 * Create an image frame.
 *
 * @param slug - Required identifier for the frame.
 * @param src - Image URL, passed to the rendered `<img>`.
 * @param options - Optional `alt`, `width`, and `height`.
 * @returns An {@link ImageFrame} with only the provided options set.
 *
 * @example
 * ```ts
 * image('sun', '/sun.png', { alt: '太陽' })
 * ```
 */
export function image(
  slug: string,
  src: string,
  options?: { alt?: string; width?: number; height?: number },
): ImageFrame {
  const frame: ImageFrame = { slug, type: 'image', src }
  if (options?.alt !== undefined) frame.alt = options.alt
  if (options?.width !== undefined) frame.width = options.width
  if (options?.height !== undefined) frame.height = options.height
  return frame
}

/**
 * Create an element frame from an arbitrary node (escape hatch).
 *
 * The node is cloned into the cell, so event listeners and live state are not
 * carried over.
 *
 * @param slug - Required identifier for the frame.
 * @param node - The element to clone into the cell.
 * @returns An {@link ElementFrame}.
 */
export function element(slug: string, node: HTMLElement): ElementFrame {
  return { slug, type: 'element', node }
}

/**
 * Resolve a frame to a human-readable string, used for a11y aggregation.
 *
 * - `text` → `value`
 * - `image` → `alt`, falling back to `slug`
 * - `element` → the node's `aria-label`, falling back to an empty string
 *
 * @param frame - The frame to read.
 * @returns The frame's display text.
 *
 * @example
 * ```ts
 * ariaLabelFormatter: (frames) => frames.map(frameText).join(' ')
 * ```
 */
export function frameText(frame: Frame): string {
  switch (frame.type) {
    case 'text':
      return frame.value
    case 'image':
      return frame.alt ?? frame.slug
    case 'element':
      return frame.node.getAttribute('aria-label') ?? ''
  }
}
