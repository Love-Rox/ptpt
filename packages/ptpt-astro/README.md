# @love-rox/ptpt-astro

[Astro](https://astro.build) integration and components for
[ptpt](https://github.com/Love-Rox/ptpt) split-flap displays.

The integration wires up the Markdown plugin, injects the stylesheet, and runs
the client hydrator for you. The components let you drop a display straight into
`.astro` templates.

## Install

```sh
bun add @love-rox/ptpt-astro @love-rox/ptpt-core
```

`astro` (>=4) and `@love-rox/ptpt-core` are peer dependencies.

## Integration

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config'
import ptpt from '@love-rox/ptpt-astro'

export default defineConfig({
  integrations: [ptpt()],
})
```

By default it:

- registers [`@love-rox/ptpt-rehype`](../ptpt-rehype) for Markdown/MDX, so
  `<span class="patapata">…</span>` and ` ```patapata ` blocks animate;
- injects `@love-rox/ptpt-core/styles.css`;
- runs the client hydrator on every page.

Toggle each with options, and forward rehype options via `markdown`:

```ts
ptpt({ styles: false, markdown: { defaultPreset: 'digits' } })
```

## Components

```astro
---
import Patapata from '@love-rox/ptpt-astro/Patapata.astro'
import PatapataBoard from '@love-rox/ptpt-astro/PatapataBoard.astro'
---

<Patapata target="HELLO" preset="alpha" />

<PatapataBoard targets={`HELLO\nWORLD`} preset="alpha" />
```

Both emit static, readable markup that the integration's hydrator animates on
load. `Patapata` is a single inline display; `PatapataBoard` splits on newlines
into rows.

## License

MIT
