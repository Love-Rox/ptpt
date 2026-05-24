import type { Cell, FlipOptions } from './cell'
import { type Frame, frameText } from './frame'
import { prefersReducedMotion } from './reduced-motion'

/** When the board updates its `aria-label` relative to the flip. */
export type AnnounceTiming = 'after' | 'immediate' | 'both'

/** Options for {@link createBoard}. */
export type BoardOptions = {
  /** Per-cell start delay (ms) to stagger the flip. Defaults to no delay. */
  delayFn?: (index: number, total: number) => number
  /** When to update `aria-label`. Defaults to `'after'`. */
  announceTiming?: AnnounceTiming
  /** Aggregate the cells' frames into the `aria-label`. Defaults to a space join. */
  ariaLabelFormatter?: (frames: Frame[]) => string
}

/** A group of {@link Cell}s flipped together. Create with {@link createBoard}. */
export type Board = {
  /**
   * Flip the board. Accepts a per-position slug array (`null` keeps a cell as
   * is) or a string (sugar for `[...str]`).
   *
   * @returns A promise that resolves once every cell has settled.
   */
  flipTo(slugs: (string | null)[] | string, options?: FlipOptions): Promise<void>
  /** Destroy every cell and remove the board's a11y attributes. */
  destroy(): void
  /** The cells, in order. */
  readonly cells: readonly Cell[]
  /** The element annotated as the `role="status"` region (nearest common ancestor). */
  readonly element: HTMLElement
}

const defaultFormatter = (frames: Frame[]): string => frames.map(frameText).join(' ')

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** Nearest element that contains every cell (and is not itself a cell). */
function resolveBoardElement(cells: Cell[]): HTMLElement {
  const elements = cells.map((cell) => cell.element)
  const [first, ...rest] = elements
  if (!first) throw new Error('ptpt: createBoard needs at least one cell')

  const firstChain: HTMLElement[] = []
  for (let node: HTMLElement | null = first; node; node = node.parentElement) {
    firstChain.push(node)
  }
  const depthOf = new Map(firstChain.map((el, index) => [el, index]))

  let deepest = 0
  for (const element of rest) {
    let node: HTMLElement | null = element
    while (node && !depthOf.has(node)) node = node.parentElement
    if (!node) throw new Error('ptpt: cells do not share a common ancestor')
    deepest = Math.max(deepest, depthOf.get(node) ?? 0)
  }

  const cellElements = new Set(elements)
  let board: HTMLElement | null = firstChain[deepest] ?? null
  while (board && cellElements.has(board)) board = board.parentElement
  if (!board) throw new Error('ptpt: cells have no element to host the board')
  return board
}

/**
 * Group cells into a board: staggered flips plus a single `role="status"`
 * live region that announces the final reading.
 *
 * @param cells - The cells, in reading order.
 * @param options - See {@link BoardOptions}.
 * @returns A {@link Board}.
 *
 * @example
 * ```ts
 * const board = createBoard(cells, { delayFn: wave({ step: 50 }) })
 * await board.flipTo('HELLO')
 * ```
 */
export function createBoard(cells: Cell[], options: BoardOptions = {}): Board {
  const cellList = [...cells]
  const element = resolveBoardElement(cellList)
  const delayFn = options.delayFn ?? (() => 0)
  const announceTiming = options.announceTiming ?? 'after'
  const formatter = options.ariaLabelFormatter ?? defaultFormatter

  let destroyed = false
  let flipToken = 0

  // a11y scaffolding
  element.classList.add('ptpt-board')
  element.setAttribute('role', 'status')
  element.setAttribute('aria-live', 'polite')
  element.setAttribute('aria-atomic', 'true')
  element.setAttribute('aria-busy', 'false')
  for (const cell of cellList) cell.element.setAttribute('aria-hidden', 'true')

  const setAriaLabel = (frames: Frame[]) => element.setAttribute('aria-label', formatter(frames))
  const setBusy = (busy: boolean) => element.setAttribute('aria-busy', String(busy))
  const finalFrames = () => cellList.map((cell) => cell.currentFrame)
  const predictedFrames = (targets: (string | null)[]) =>
    cellList.map((cell, index) => {
      const target = targets[index]
      return target == null ? cell.currentFrame : cell.frameFor(target)
    })

  setAriaLabel(finalFrames())

  async function flipTo(
    slugs: (string | null)[] | string,
    flipOptions?: FlipOptions,
  ): Promise<void> {
    if (destroyed) throw new Error('ptpt: board is destroyed')
    const targets = typeof slugs === 'string' ? [...slugs] : slugs
    const reduced = prefersReducedMotion()

    if (reduced) {
      // Degraded motion: announce immediately, never toggle aria-busy.
      setAriaLabel(predictedFrames(targets))
    } else {
      if (announceTiming === 'immediate' || announceTiming === 'both') {
        setAriaLabel(predictedFrames(targets))
      }
      setBusy(true)
    }

    const flips: Promise<void>[] = []
    targets.forEach((slug, index) => {
      if (slug == null) return
      const cell = cellList[index]
      if (!cell) return
      const delay = delayFn(index, cellList.length)
      flips.push(
        delay > 0
          ? sleep(delay).then(() => cell.flipTo(slug, flipOptions))
          : cell.flipTo(slug, flipOptions),
      )
    })

    const token = ++flipToken
    try {
      await Promise.all(flips)
    } finally {
      // Only the most recent flip settles the board (latest-target wins).
      if (token === flipToken && !destroyed && !reduced) {
        setBusy(false)
        if (announceTiming === 'after' || announceTiming === 'both') {
          setAriaLabel(finalFrames())
        }
      }
    }
  }

  function destroy(): void {
    if (destroyed) return
    destroyed = true
    for (const cell of cellList) {
      cell.element.removeAttribute('aria-hidden')
      cell.destroy()
    }
    element.classList.remove('ptpt-board')
    for (const attr of ['role', 'aria-live', 'aria-atomic', 'aria-busy', 'aria-label']) {
      element.removeAttribute(attr)
    }
  }

  return {
    flipTo,
    destroy,
    get cells() {
      return cellList
    },
    get element() {
      return element
    },
  }
}
