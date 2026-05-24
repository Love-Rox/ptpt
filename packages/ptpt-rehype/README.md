# @love-rox/ptpt-rehype

A [rehype](https://github.com/rehypejs/rehype) plugin + client hydrator that
turns marked Markdown/HTML into [ptpt](https://github.com/Love-Rox/ptpt)
split-flap displays.

It's progressive: the plugin emits plain, readable text with `data-ptpt-*`
attributes at build time, and the `hydrate` helper animates it in the browser.
No JS → you still see the text.

## Install

```sh
bun add @love-rox/ptpt-rehype @love-rox/ptpt-core
```

`@love-rox/ptpt-core` is a peer dependency (used by the client hydrator).

## Plugin

```ts
import { rehype } from 'rehype'
import rehypePtpt from '@love-rox/ptpt-rehype'

const html = await rehype().use(rehypePtpt).process(input)
```

In a Markdown pipeline, add it to your `rehypePlugins`.

Two input forms are recognized:

- **Inline** — an element with the marker class:

  ```html
  <span class="patapata" data-preset="alpha" data-duration="120">HELLO</span>
  ```

- **Block** — a fenced code block tagged with the fence language (one board row
  per line):

  ````md
  ```patapata
  HELLO
  WORLD
  ```
  ````

Options: `className` (default `'patapata'`), `fenceLanguage` (default
`'patapata'`), `defaultPreset`.

Each match becomes an element with `data-ptpt-targets` plus optional
`data-ptpt-preset` / `-duration` / `-direction`.

## Hydrate

```ts
import { hydrate } from '@love-rox/ptpt-rehype/client'
import '@love-rox/ptpt-core/styles.css'

hydrate() // scans the document for [data-ptpt-targets] and animates them
```

`hydrate(root?, { presets })` returns the created boards. Preset names resolve
against the built-ins; pass `presets` to add or override.

> The chosen preset must contain every character in the target; otherwise that
> board is left blank.

## License

MIT
