import { type Cell, type CellOptions, createCell, type FlipOptions } from '@love-rox/ptpt-core'
import { onBeforeUnmount, onMounted, type Ref, ref } from 'vue'

/** Return value of {@link useFlipCell}. */
export type UseFlipCellReturn = {
  /** Bind to the host element with `ref`. */
  ref: Ref<HTMLDivElement | null>
  /** Flip the cell; resolves once it settles. No-op before the cell mounts. */
  flipTo: (slug: string, options?: FlipOptions) => Promise<void>
  /** The settled slug (updated after each flip). */
  current: Ref<string>
}

/**
 * Imperatively control a single cell from a Vue component.
 *
 * @param options - {@link CellOptions} for the cell (read once on mount).
 * @returns A {@link UseFlipCellReturn}.
 *
 * @example
 * ```ts
 * const { ref: el, flipTo, current } = useFlipCell({ preset: digitsPreset })
 * ```
 */
export function useFlipCell(options?: CellOptions): UseFlipCellReturn {
  const el = ref<HTMLDivElement | null>(null)
  const current = ref('')
  let cell: Cell | null = null

  onMounted(() => {
    if (!el.value) return
    cell = createCell(el.value, options)
    current.value = cell.current
  })

  onBeforeUnmount(() => {
    cell?.destroy()
    cell = null
  })

  const flipTo = (slug: string, flipOptions?: FlipOptions): Promise<void> => {
    if (!cell) return Promise.resolve()
    const active = cell
    return active.flipTo(slug, flipOptions).then(() => {
      current.value = active.current
    })
  }

  return { ref: el, flipTo, current }
}
