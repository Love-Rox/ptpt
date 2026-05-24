import {
  type Board,
  type CellOptions,
  createBoard,
  createCell,
  type PresetDefinition,
  presets,
} from '@love-rox/ptpt-core'

/** Options for {@link hydrate}. */
export type HydrateOptions = {
  /** Extra presets by name (merged over the built-ins) for `data-ptpt-preset`. */
  presets?: Record<string, PresetDefinition>
}

/**
 * Animate the static split-flap markup produced by the rehype plugin.
 *
 * Scans `root` for elements with `data-ptpt-targets` (skipping already-hydrated
 * ones), builds their cells, and flips to the target. Reads optional
 * `data-ptpt-preset` / `-duration` / `-direction` attributes.
 *
 * @param root - Where to look. Defaults to `document`.
 * @param options - See {@link HydrateOptions}.
 * @returns The boards created, in document order.
 *
 * @example
 * ```ts
 * import { hydrate } from '@love-rox/ptpt-rehype/client'
 * hydrate()
 * ```
 */
export function hydrate(root: ParentNode = document, options: HydrateOptions = {}): Board[] {
  const presetMap: Record<string, PresetDefinition> = { ...presets, ...options.presets }
  const boards: Board[] = []

  const containers = root.querySelectorAll<HTMLElement>(
    '[data-ptpt-targets]:not([data-ptpt-hydrated])',
  )
  for (const container of containers) {
    const targets = container.getAttribute('data-ptpt-targets') ?? ''
    const presetName = container.getAttribute('data-ptpt-preset')
    const durationAttr = container.getAttribute('data-ptpt-duration')
    const direction = container.getAttribute('data-ptpt-direction')

    const cellOptions: CellOptions = {}
    if (presetName && Object.hasOwn(presetMap, presetName)) {
      const preset = presetMap[presetName]
      if (preset) cellOptions.preset = preset
    }
    if (durationAttr) {
      const duration = Number(durationAttr)
      if (!Number.isNaN(duration)) cellOptions.durationPerFlap = duration
    }
    if (direction === 'forward' || direction === 'shortest') cellOptions.direction = direction

    container.replaceChildren()
    const cells = [...targets].map(() => {
      const el = container.ownerDocument.createElement('div')
      container.appendChild(el)
      return createCell(el, cellOptions)
    })
    container.setAttribute('data-ptpt-hydrated', '')

    const board = createBoard(cells)
    board.flipTo(targets).catch(() => {
      /* a target char missing from the preset; leave the cell blank */
    })
    boards.push(board)
  }

  return boards
}
