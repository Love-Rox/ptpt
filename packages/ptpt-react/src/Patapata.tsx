'use client'

import { type Cell, type CellOptions, createCell, type FlipOptions } from '@love-rox/ptpt-core'
import { type CSSProperties, type ReactElement, useEffect, useRef } from 'react'

/** Props for {@link Patapata}. Extends {@link CellOptions}. */
export type PatapataProps = CellOptions & {
  /** Slug to flip to whenever it changes. */
  target: string
  /** Flip mode for target changes. */
  flipMode?: FlipOptions['mode']
  className?: string
  style?: CSSProperties
  /** Called after each flip settles. */
  onFlipComplete?: () => void
}

/**
 * A single split-flap cell as a React component.
 *
 * The cell is created on mount from the {@link CellOptions} props (read once)
 * and flips whenever `target` changes.
 *
 * @example
 * ```tsx
 * <Patapata preset={digitsPreset} target="7" />
 * ```
 */
export function Patapata(props: PatapataProps): ReactElement {
  const { target, flipMode, className, style, onFlipComplete, ...cellOptions } = props
  const ref = useRef<HTMLDivElement>(null)
  const cellRef = useRef<Cell | null>(null)
  const optionsRef = useRef(cellOptions)
  optionsRef.current = cellOptions
  const onCompleteRef = useRef(onFlipComplete)
  onCompleteRef.current = onFlipComplete

  useEffect(() => {
    const host = ref.current
    if (!host) return
    const cell = createCell(host, optionsRef.current)
    cellRef.current = cell
    return () => {
      cell.destroy()
      cellRef.current = null
    }
  }, [])

  useEffect(() => {
    const cell = cellRef.current
    if (!cell) return
    let cancelled = false
    cell
      .flipTo(target, flipMode ? { mode: flipMode } : undefined)
      .then(() => {
        if (!cancelled) onCompleteRef.current?.()
      })
      .catch(() => {
        /* destroyed mid-flip; ignore */
      })
    return () => {
      cancelled = true
    }
  }, [target, flipMode])

  return <div ref={ref} className={className} style={style} />
}
