# @love-rox/ptpt-core

Framework-agnostic split-flap (patapata / Solari / Vestaboard-style) display for
the web. Zero dependencies, ESM only, ships its own types.

The point of a split-flap is the _wait_ — the analog ticking as flaps turn. ptpt
keeps that feel while staying a thin DOM layer over pure functions.

## Install

```sh
bun add @love-rox/ptpt-core
# or: npm i @love-rox/ptpt-core
```

## Minimal example

```ts
import { createCell, createBoard } from '@love-rox/ptpt-core'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'
import '@love-rox/ptpt-core/styles.css' // optional default look

const root = document.getElementById('counter')!
const cells = Array.from({ length: 3 }, () => {
  const el = document.createElement('div')
  root.appendChild(el)
  return createCell(el, { preset: digitsPreset })
})

const board = createBoard(cells)
await board.flipTo('042') // string sugar → ['0', '4', '2']
```

A single cell, imperatively:

```ts
const cell = createCell(el, { preset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ' })
await cell.flipTo('Z') // resolves once the flaps settle on Z
```

## Frames

A cell flips through **frames**. Strings are normalized to text frames; images
and elements are explicit.

```ts
import { text, image, element } from '@love-rox/ptpt-core'

createCell(el, {
  frames: [
    'A', // text, slug = 'A'
    text('a-red', 'A'), // same glyph, distinct slug
    image('sun', '/sun.svg', { alt: '太陽' }),
    element('clock', myNode), // cloned into the cell
  ],
})
```

`preset` and `frames` are mutually exclusive; with neither, the default preset
(blank + A–Z + 0–9 + symbols) is used.

## Boards

`createBoard(cells, options)` flips cells together and manages one
`role="status"` live region (announcing only the settled result).

```ts
import { createBoard } from '@love-rox/ptpt-core'
import { wave } from '@love-rox/ptpt-core/delays/wave'

const board = createBoard(cells, {
  delayFn: wave({ direction: 'ltr', step: 50 }), // staggered sweep
  announceTiming: 'after', // when to update aria-label
})

board.flipTo(['H', 'I', null, 'sun']) // null leaves a cell unchanged
```

## Presets & delays

Both are available as a convenience object and as tree-shakable subpaths.

```ts
import { presets, delays } from '@love-rox/ptpt-core'
presets.digits // { name, chars, description, ... }
delays.random(300)

// tree-shakable:
import { alphaPreset } from '@love-rox/ptpt-core/presets/alpha'
import { uniform } from '@love-rox/ptpt-core/delays/uniform'
```

Built-in presets: `default`, `alphanumeric`, `digits`, `alpha`.
Built-in delays: `uniform()`, `random(maxMs)`, `wave({ direction, step })`.

## Styling

Importing `@love-rox/ptpt-core/styles.css` gives a working dark look. Everything
is themeable via custom properties on `.ptpt-cell`:

```css
.ptpt-cell {
  --ptpt-width: 48px;
  --ptpt-height: 72px;
  --ptpt-flip-duration: 200ms;
  --ptpt-color: #f0e8d0;
  --ptpt-flap-bg: #2a2a2a;
}
```

For a fully headless setup, skip the stylesheet and target the classes
yourself: `.ptpt-cell`, `.ptpt-half`, `.ptpt-top`, `.ptpt-top-preview`,
`.ptpt-bottom`, `.glyph` (plus `.ptpt-cell.flipping` during a flip and
`.ptpt-board` on the live region).

## Accessibility

- The board is a `role="status"` `aria-live="polite"` region; cells are
  `aria-hidden` so mid-flip states aren't announced.
- `aria-label` aggregates the cells' frames (text `value` / image `alt`,
  falling back to slug). Override with `ariaLabelFormatter`.
- `reducedMotion` (`'instant'` default, `'minimal'`, `'ignore'`) is honored
  automatically when the OS prefers reduced motion.

## License

MIT
