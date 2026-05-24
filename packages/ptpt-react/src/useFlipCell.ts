'use client'

import { type Cell, type CellOptions, createCell, type FlipOptions } from '@love-rox/ptpt-core'
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

/** Return value of {@link useFlipCell}. */
export type UseFlipCellReturn = {
  /** Attach to the host element of the cell. */
  ref: RefObject<HTMLDivElement | null>
  /** Flip the cell; resolves once it settles. No-op before the cell mounts. */
  flipTo: (slug: string, options?: FlipOptions) => Promise<void>
  /** The settled slug (updated after each flip). */
  current: string
}

/**
 * Imperatively control a single cell from React.
 *
 * Options are read once on mount; remount (e.g. via a `key`) to apply new
 * structural options.
 *
 * @param options - {@link CellOptions} for the cell.
 * @returns A {@link UseFlipCellReturn}.
 *
 * @example
 * ```tsx
 * const { ref, flipTo, current } = useFlipCell({ preset: digitsPreset })
 * return <div ref={ref} onClick={() => flipTo('7')} />
 * ```
 */
export function useFlipCell(options?: CellOptions): UseFlipCellReturn {
  const ref = useRef<HTMLDivElement>(null)
  const cellRef = useRef<Cell | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options
  const [current, setCurrent] = useState('')

  useEffect(() => {
    const host = ref.current
    if (!host) return
    const cell = createCell(host, optionsRef.current)
    cellRef.current = cell
    setCurrent(cell.current)
    return () => {
      cell.destroy()
      cellRef.current = null
    }
  }, [])

  const flipTo = useCallback((slug: string, flipOptions?: FlipOptions) => {
    const cell = cellRef.current
    if (!cell) return Promise.resolve()
    return cell.flipTo(slug, flipOptions).then(() => setCurrent(cell.current))
  }, [])

  return { ref, flipTo, current }
}
