# @love-rox/ptpt-vue

Vue 3 wrapper for [ptpt](https://github.com/Love-Rox/ptpt), the split-flap
(patapata) display library. Thin components over `@love-rox/ptpt-core`.

## Install

```sh
bun add @love-rox/ptpt-vue @love-rox/ptpt-core vue
```

`vue` (>=3.4) and `@love-rox/ptpt-core` are peer dependencies.

## `<Patapata>`

A single cell. Accepts the `CellOptions` as props plus a `target`; emits
`flip-complete` after each flip. `class` / `style` fall through to the root.

```vue
<script setup lang="ts">
import { Patapata } from '@love-rox/ptpt-vue'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'
import '@love-rox/ptpt-core/styles.css'

defineProps<{ hour: string }>()
</script>

<template>
  <Patapata :preset="digitsPreset" :target="hour" @flip-complete="() => {}" />
</template>
```

Options are read on mount; pass a `key` to rebuild. Use `flip-mode="queue"` to
queue instead of replace.

## `<PatapataBoard>`

A board of cells; the cell count comes from `targets`.

```vue
<script setup lang="ts">
import { PatapataBoard } from '@love-rox/ptpt-vue'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'
import { wave } from '@love-rox/ptpt-core/delays/wave'
</script>

<template>
  <PatapataBoard
    :cell-options="{ preset: digitsPreset }"
    :targets="String(value).padStart(3, '0')"
    :delay-fn="wave({ step: 50 })"
  />
</template>
```

- `cell-options` apply to every cell; `cell-options-override[i]` merges per cell.
- `targets` is a string or a `(string | null)[]` (`null` keeps a cell).
- `BoardOptions` (`delayFn`, `announceTiming`, `ariaLabelFormatter`) are props.

## `useFlipCell`

For imperative control.

```vue
<script setup lang="ts">
import { useFlipCell } from '@love-rox/ptpt-vue'

const { ref: el, flipTo, current } = useFlipCell({ preset: 'AB' })
</script>

<template>
  <div :ref="el" @click="flipTo(current === 'A' ? 'B' : 'A')" />
</template>
```

## License

MIT
