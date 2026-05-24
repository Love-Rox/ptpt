import type { Frame, FrameInput } from './frame'
import { normalizeFrames } from './normalize'
import { computeFlipPath, type FlipDirection } from './path'
import { defaultPreset } from './presets/default'
import type { PresetDefinition } from './presets/_types'
import { prefersReducedMotion } from './reduced-motion'

/** How a cell degrades when the user prefers reduced motion. */
export type ReducedMotion = 'instant' | 'minimal' | 'ignore'

/** Options for {@link createCell}. */
export type CellOptions = {
  /**
   * Frame set as a preset. Either a {@link PresetDefinition} (its
   * `recommendedDuration` / `locale` are used as defaults) or a string of
   * characters. Mutually exclusive with {@link CellOptions.frames}. Defaults to
   * the built-in default preset.
   */
  preset?: PresetDefinition | string
  /** Explicit frame set. Mutually exclusive with {@link CellOptions.preset}. */
  frames?: FrameInput[]
  /** Milliseconds for one flap. Defaults to the preset's recommendation, else 200. */
  durationPerFlap?: number
  /** Direction through the frame ring. Defaults to `'forward'`. */
  direction?: FlipDirection
  /** Behavior when the OS prefers reduced motion. Defaults to `'instant'`. */
  reducedMotion?: ReducedMotion
  /** Image rendering strategy. v1 supports only `'dom'`. */
  imageRenderer?: 'dom'
}

/** Continuous-call behavior for {@link Cell.flipTo}. */
export type FlipOptions = { mode?: 'replace' | 'queue' }

/** A single split-flap cell. Create with {@link createCell}. */
export type Cell = {
  /**
   * Flip the cell to the frame identified by `slug`.
   *
   * @returns A promise that resolves when the cell has settled at its final
   *   target. With `replace`, calls coalesce: every pending promise resolves
   *   together once the latest target is reached. With `queue`, calls run in
   *   order, each resolving when its own target is reached.
   * @throws If `slug` is unknown or the cell has been destroyed.
   */
  flipTo(slug: string, options?: FlipOptions): Promise<void>
  /** Stop animating, reject pending flips, and detach the cell's DOM. */
  destroy(): void
  /** The slug currently displayed. */
  readonly current: string
  /** The frame currently displayed. */
  readonly currentFrame: Frame
  /**
   * Resolve a slug to its frame.
   *
   * @throws If `slug` is not in this cell's frame set.
   */
  frameFor(slug: string): Frame
  /** The host element passed to {@link createCell}. */
  readonly element: HTMLElement
}

type Waiter = { resolve: () => void; reject: (error: Error) => void }
type Segment = { slug: string; waiters: Waiter[] }
type ActiveFlip = { timers: ReturnType<typeof setTimeout>[]; settle: () => void }

// Read NODE_ENV without depending on Node type definitions (this is a
// browser-first, zero-dependency package).
const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process
const isDev = proc !== undefined && proc.env?.NODE_ENV !== 'production'

function resolveFrames(options: CellOptions): Frame[] {
  if (options.frames && options.preset) {
    throw new Error('ptpt: `preset` and `frames` are mutually exclusive')
  }
  if (options.frames) return normalizeFrames(options.frames)

  const preset = options.preset ?? defaultPreset
  const chars = typeof preset === 'string' ? preset : preset.chars
  return normalizeFrames([...chars])
}

function resolveDuration(options: CellOptions): number {
  if (options.durationPerFlap !== undefined) return options.durationPerFlap
  if (typeof options.preset === 'object' && options.preset.recommendedDuration !== undefined) {
    return options.preset.recommendedDuration
  }
  return 200
}

/**
 * Create a split-flap cell inside `element`.
 *
 * Builds the 3-element DOM structure (`.ptpt-top-preview`, `.ptpt-top`,
 * `.ptpt-bottom`, each holding a `.glyph`), renders the first frame, and
 * returns a handle for flipping it.
 *
 * @param element - Host element; its contents are replaced.
 * @param options - See {@link CellOptions}.
 * @returns A {@link Cell}.
 *
 * @example
 * ```ts
 * const cell = createCell(el, { preset: digitsPreset })
 * await cell.flipTo('7')
 * ```
 */
export function createCell(element: HTMLElement, options: CellOptions = {}): Cell {
  const frames = resolveFrames(options)
  if (frames.length === 0) {
    throw new Error('ptpt: a cell needs at least one frame')
  }
  const indexBySlug = new Map(frames.map((frame, index) => [frame.slug, index]))
  const duration = Math.max(0, resolveDuration(options))
  const direction: FlipDirection = options.direction ?? 'forward'
  const reducedMotion: ReducedMotion = options.reducedMotion ?? 'instant'

  // --- DOM ---
  element.classList.add('ptpt-cell')
  element.style.setProperty('--ptpt-flip-duration', `${duration}ms`)
  const previewGlyph = buildHalf(element, 'ptpt-top-preview')
  const topGlyph = buildHalf(element, 'ptpt-top')
  const bottomGlyph = buildHalf(element, 'ptpt-bottom')

  // --- state ---
  let currentSlug = frames[0]?.slug ?? ''
  const segments: Segment[] = []
  let running = false
  let destroyed = false
  let activeFlip: ActiveFlip | null = null

  renderAll(currentSlug)

  function frameBySlug(slug: string): Frame {
    const index = indexBySlug.get(slug)
    const frame = index === undefined ? undefined : frames[index]
    if (!frame) throw new Error(`ptpt: unknown frame slug "${slug}"`)
    return frame
  }

  function renderAll(slug: string): void {
    const frame = frameBySlug(slug)
    renderGlyph(previewGlyph, frame)
    renderGlyph(topGlyph, frame)
    renderGlyph(bottomGlyph, frame)
    currentSlug = slug
  }

  /** Animate one flap, current → `frame`. Resolves when it settles. */
  function flipOnce(frame: Frame): Promise<void> {
    return new Promise<void>((resolve) => {
      renderGlyph(previewGlyph, frame)
      // Force reflow so the animation restarts for every flap.
      void element.offsetHeight
      element.classList.add('flipping')

      const settle = () => {
        renderGlyph(topGlyph, frame)
        element.classList.remove('flipping')
        currentSlug = frame.slug
        activeFlip = null
        resolve()
      }
      const half = setTimeout(() => renderGlyph(bottomGlyph, frame), Math.floor(duration / 2))
      const end = setTimeout(settle, duration)
      activeFlip = { timers: [half, end], settle }
    })
  }

  function resolveMotion(): 'animate' | 'instant' | 'minimal' {
    if (reducedMotion === 'ignore') return 'animate'
    if (!prefersReducedMotion()) return 'animate'
    return reducedMotion
  }

  async function run(): Promise<void> {
    running = true
    try {
      while (segments.length > 0 && !destroyed) {
        const seg = segments[0]
        if (!seg) break
        const motion = resolveMotion()

        if (motion === 'instant') {
          if (currentSlug !== seg.slug) renderAll(seg.slug)
        } else if (motion === 'minimal') {
          while (currentSlug !== seg.slug && !destroyed) {
            await flipOnce(frameBySlug(seg.slug))
          }
        } else {
          while (currentSlug !== seg.slug && !destroyed) {
            const goalSlug = seg.slug
            const path = computeFlipPath(frames, currentSlug, goalSlug, { direction })
            for (const index of path) {
              if (destroyed || seg.slug !== goalSlug) break
              const frame = frames[index]
              if (frame) await flipOnce(frame)
            }
          }
        }

        if (destroyed) break
        segments.shift()
        for (const waiter of seg.waiters) waiter.resolve()
      }
    } finally {
      running = false
    }
  }

  function flipTo(slug: string, flipOptions?: FlipOptions): Promise<void> {
    if (destroyed) throw new Error('ptpt: cell is destroyed')
    if (!indexBySlug.has(slug)) throw new Error(`ptpt: unknown frame slug "${slug}"`)
    const mode = flipOptions?.mode ?? 'replace'

    return new Promise<void>((resolve, reject) => {
      const waiter: Waiter = { resolve, reject }
      const last = segments[segments.length - 1]
      if (mode === 'replace' && last) {
        last.slug = slug
        last.waiters.push(waiter)
      } else {
        segments.push({ slug, waiters: [waiter] })
      }
      if (!running) void run()
    })
  }

  function destroy(): void {
    if (destroyed) return
    destroyed = true

    if (activeFlip) {
      for (const timer of activeFlip.timers) clearTimeout(timer)
      const flip = activeFlip
      activeFlip = null
      flip.settle() // unblock the run loop; it will see `destroyed` and stop
    }

    const error = new Error('ptpt: cell destroyed')
    for (const segment of segments) {
      for (const waiter of segment.waiters) waiter.reject(error)
    }
    segments.length = 0

    element.classList.remove('ptpt-cell', 'flipping')
    element.style.removeProperty('--ptpt-flip-duration')
    element.replaceChildren()
  }

  return {
    flipTo,
    destroy,
    frameFor: frameBySlug,
    get current() {
      return currentSlug
    },
    get currentFrame() {
      return frameBySlug(currentSlug)
    },
    get element() {
      return element
    },
  }
}

function buildHalf(host: HTMLElement, half: 'ptpt-top-preview' | 'ptpt-top' | 'ptpt-bottom') {
  const doc = host.ownerDocument
  const halfEl = doc.createElement('div')
  halfEl.className = `ptpt-half ${half}`
  const glyph = doc.createElement('div')
  glyph.className = 'glyph'
  halfEl.appendChild(glyph)
  host.appendChild(halfEl)
  return glyph
}

function renderGlyph(glyph: HTMLElement, frame: Frame): void {
  if (frame.type === 'text') {
    glyph.textContent = frame.value
    return
  }
  glyph.replaceChildren()
  if (frame.type === 'image') {
    const img = glyph.ownerDocument.createElement('img')
    img.src = frame.src
    img.alt = frame.alt ?? frame.slug
    if (frame.width !== undefined) img.width = frame.width
    if (frame.height !== undefined) img.height = frame.height
    if (isDev && frame.alt === undefined) {
      console.warn(`ptpt: image frame "${frame.slug}" has no alt; falling back to slug`)
    }
    glyph.appendChild(img)
    return
  }
  // element frame: clone (listeners / live state are not carried over)
  glyph.appendChild(frame.node.cloneNode(true))
}
