# ptpt (patapata)

A split-flap (パタパタ) display library for the web — recreate the feel of
airport departure boards, Solari di Udine, and Vestaboard in the browser.

> **ptpt** is the vowel-dropped short form of **patapata**, following the naming
> of its sibling library [`tcy`](https://github.com/Love-Rox/tcy).

The point of a split-flap is the _wait_ — the analog ticking as flaps turn. ptpt
keeps that on purpose, as a thin DOM layer over pure functions: a
framework-agnostic core with optional, paper-thin framework wrappers.

## Packages

| Package                                       | What                                                         |
| --------------------------------------------- | ------------------------------------------------------------ |
| [`@love-rox/ptpt-core`](packages/ptpt-core)   | Framework-agnostic core. Zero dependencies, ESM, ~3 KB gzip. |
| [`@love-rox/ptpt-react`](packages/ptpt-react) | React components + `useFlipCell` (RSC-ready `"use client"`). |
| [`@love-rox/ptpt-vue`](packages/ptpt-vue)     | Vue 3 components + `useFlipCell` composable.                 |

## Quick start

```sh
bun add @love-rox/ptpt-core
```

```ts
import { createCell, createBoard } from '@love-rox/ptpt-core'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'
import '@love-rox/ptpt-core/styles.css'

const cells = Array.from({ length: 3 }, () => {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return createCell(el, { preset: digitsPreset })
})

const board = createBoard(cells)
await board.flipTo('042') // string sugar → ['0', '4', '2']
```

React:

```tsx
import { PatapataBoard } from '@love-rox/ptpt-react'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'

function Counter() {
  return <PatapataBoard cellOptions={{ preset: digitsPreset }} targets="042" />
}
```

## Design

- **Frames** are the flaps: text, image, or element, addressed by a `slug`.
- **Cell** is one flapping unit; **Board** groups cells, staggers them with a
  `delayFn`, and exposes one `role="status"` live region for screen readers.
- Presets and delay functions ship as tree-shakable subpaths.
- Reduced-motion is honored automatically.

See [`docs/DESIGN.md`](docs/DESIGN.md) for the full spec and
[`docs/EXAMPLES.md`](docs/EXAMPLES.md) for worked examples.

## Development

This is a Bun workspace. Lint and format run on [Vite+](https://viteplus.dev)
(`vp`).

```sh
bun install
bun run test        # vitest (happy-dom)
bun run typecheck   # tsc --noEmit
bun run lint        # vp lint (Oxlint)
bun run format      # vp fmt (Oxfmt)
bun run build       # vite library builds
```

Releases are managed with [changesets](https://github.com/changesets/changesets):
`bun changeset` to record a change, then the Release workflow opens a version PR
and publishes on merge.

---

# ptpt（パタパタ）

Web 向けのスプリットフラップ（パタパタ）ディスプレイ・ライブラリ。空港の発車標、
Solari di Udine、Vestaboard のような体験をブラウザで再現します。

> **ptpt** は **patapata** から母音を抜いた省略形で、姉妹ライブラリ
> [`tcy`](https://github.com/Love-Rox/tcy) と同じ命名規則です。

パタパタの本質は「待つ」こと——フラップがめくれるアナログな間です。ptpt はそれを
あえて残し、純粋関数の上に薄い DOM 操作層を重ねます。framework-agnostic なコアと、
極薄のフレームワーク用ラッパーで構成されています。

## パッケージ

| パッケージ                                    | 内容                                                              |
| --------------------------------------------- | ----------------------------------------------------------------- |
| [`@love-rox/ptpt-core`](packages/ptpt-core)   | 依存ゼロのコア。ESM、gzip 約 3 KB。                               |
| [`@love-rox/ptpt-react`](packages/ptpt-react) | React コンポーネント + `useFlipCell`（RSC 対応 `"use client"`）。 |
| [`@love-rox/ptpt-vue`](packages/ptpt-vue)     | Vue 3 コンポーネント + `useFlipCell` コンポーザブル。             |

## クイックスタート

上の Quick start を参照してください。最小構成はセルを作って `board.flipTo()` を
呼ぶだけです。`@love-rox/ptpt-core/styles.css` を import すれば「とりあえず動く
見た目」になります。

## 設計

- **Frame**（フラップ）は text / image / element のいずれかで、`slug` で識別します。
- **Cell** は 1 個のパタパタ、**Board** は複数の Cell を束ね、`delayFn` で時間差を
  付け、スクリーンリーダー向けに 1 つの `role="status"` ライブリージョンを持ちます。
- プリセットと delay 関数は tree-shakable なサブパスで提供します。
- `prefers-reduced-motion` に自動連動します。

詳細は [`docs/DESIGN.md`](docs/DESIGN.md)、ユースケースは
[`docs/EXAMPLES.md`](docs/EXAMPLES.md) を参照してください。

## ライセンス / License

[MIT](LICENSE)
