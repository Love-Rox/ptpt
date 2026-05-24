# @love-rox/ptpt-react

React wrapper for [ptpt](https://github.com/Love-Rox/ptpt), the split-flap
(patapata) display library. Thin components over `@love-rox/ptpt-core`.

The components are client-only (they ship a `"use client"` directive), so they
work in React Server Component setups like Waku and Next.js.

## Install

```sh
bun add @love-rox/ptpt-react @love-rox/ptpt-core react
```

`react` (>=18) and `@love-rox/ptpt-core` are peer dependencies.

## `<Patapata>`

A single cell. Accepts all `CellOptions` plus a `target` to flip to.

```tsx
import { Patapata } from '@love-rox/ptpt-react'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'
import '@love-rox/ptpt-core/styles.css'

function Clock({ hour }: { hour: string }) {
  return <Patapata preset={digitsPreset} target={hour} onFlipComplete={() => {}} />
}
```

Options are read on mount; pass a `key` to rebuild with new structural options.
Changing `target` triggers a flip (use `flipMode="queue"` to queue instead of
replace).

## `<PatapataBoard>`

A board of cells. The number of cells comes from `targets`.

```tsx
import { PatapataBoard } from '@love-rox/ptpt-react'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'
import { wave } from '@love-rox/ptpt-core/delays/wave'

function Counter({ value }: { value: number }) {
  return (
    <PatapataBoard
      cellOptions={{ preset: digitsPreset }}
      targets={String(value).padStart(3, '0')}
      delayFn={wave({ step: 50 })}
    />
  )
}
```

- `cellOptions` apply to every cell; `cellOptionsOverride[i]` merges per cell.
- `targets` is a string or a `(string | null)[]` (`null` keeps a cell).
- `BoardOptions` (`delayFn`, `announceTiming`, `ariaLabelFormatter`) are
  supported as props.

## `useFlipCell`

For imperative control.

```tsx
import { useFlipCell } from '@love-rox/ptpt-react'

function Toggle() {
  const { ref, flipTo, current } = useFlipCell({ preset: 'AB' })
  return <div ref={ref} onClick={() => flipTo(current === 'A' ? 'B' : 'A')} />
}
```

## License

MIT
