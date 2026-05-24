/**
 * `@love-rox/ptpt-core` — framework-agnostic split-flap (patapata) display.
 *
 * Build a single {@link createCell | cell} or a {@link createBoard | board} of
 * cells, then `flipTo` a target. Presets and stagger functions are also
 * available as tree-shakable subpaths (`@love-rox/ptpt-core/presets/*`,
 * `@love-rox/ptpt-core/delays/*`). Import `@love-rox/ptpt-core/styles.css` for
 * a working default look.
 *
 * @packageDocumentation
 */

// === Frame ===
export type { Frame, TextFrame, ImageFrame, ElementFrame, FrameInput } from './frame'
export { text, image, element, frameText } from './frame'

// === Normalization ===
export { normalizeFrames } from './normalize'

// === Flip path (pure) ===
export { computeFlipPath } from './path'
export type { FlipDirection } from './path'

// === Cell ===
export { createCell } from './cell'
export type { Cell, CellOptions, FlipOptions, ReducedMotion } from './cell'

// === Board ===
export { createBoard } from './board'
export type { Board, BoardOptions, AnnounceTiming } from './board'

// === Presets (also at ./presets and ./presets/*) ===
export { presets } from './presets'
export type { PresetDefinition } from './presets'

// === Delays (also at ./delays and ./delays/*) ===
export * as delays from './delays'
export type { DelayFn } from './delays'
