# ptpt — Implementation Plan

このドキュメントは、設計仕様(`DESIGN.md`)を基に実装フェーズを進めるための計画書。Claude Code のような実装エージェントに渡すことを想定し、判断に迷う箇所を最小化することを目的とする。

---

## 0. 実装着手前の確認事項（要：ささぴよさん判断）

エージェントに渡す前に、以下を埋めること。空欄のまま渡すとエージェントが推測で判断するため、最終成果物にブレが出る。

### 0.1 リポジトリホスト・パッケージスコープ

- [ ] **リポジトリ名**: `Love-Rox/ptpt`（推奨）/ `Love-Rox/patapata` / その他
- [ ] **npm スコープ**: `@love-rox/*`（推奨、tcy と揃える）
- [ ] **License**: `MIT`（推奨、tcy と揃える）

### 0.2 ツールチェーン

下記が推奨スタックです(2026年5月現在)。理由は後述。

- [x] **パッケージマネージャ**: `bun`
- [x] **ランタイム / スクリプト実行**: `bun`
- [x] **ビルドツール**: `vite`(library mode、内部で Rolldown を使用)
  - 補助: `vite-plugin-dts`(d.ts 生成)
- [x] **テストフレームワーク**: `vitest`(DOM 環境は `happy-dom`)
- [x] **Linter / Formatter**: `biome`

**この構成を選んだ理由**:

- **Bun + Vite が 2026年の主流組み合わせ**。Bun が install / run / test ランナーを担い、Vite が dev server + production build を担当
- **Vite 8（2026年3月 stable）が内部バンドラを Rolldown に切り替え済み**。設定は Vite 流儀のまま、エンジンは Rolldown の速度
- Vite は library mode で複数エントリ + サブパス export に対応。`vite-plugin-dts` で d.ts 出力も整う
- デモサイトを作る場合、同じ Vite で `vite dev` を立てられる(ライブラリ用とデモ用で config を分けるだけ)
- `bunx --bun vite` で Vite CLI を Bun ランタイムで実行できる(`node` 経由よりさらに速い)
- vitest は Vite と同じエコシステムなので config を共有可能

**`package.json` の scripts 例**:

```json
{
  "scripts": {
    "dev": "bunx --bun vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "biome check ."
  }
}
```

### 0.3 MVP リリーススコープ

v0.1.0 として最初に公開するパッケージ:

- [ ] **必須**: `@love-rox/ptpt-core`
- [ ] **同時公開する**: 
  - [ ] `@love-rox/ptpt-react`
  - [ ] `@love-rox/ptpt-vue`
  - [ ] `@love-rox/ptpt-rehype`（後回し可、Markdown 連携は需要が後追い）
  - [ ] `@love-rox/ptpt-astro`（後回し可）

推奨は `core` + `react`。tcy が 3 パッケージ同時公開だった流儀に合わせるなら `core` + `react` + `vue`。

### 0.4 デモサイト

- [ ] **デモサイトを作る**: Yes / No
- 作る場合の構成:
  - [ ] **ホスト**: Cloudflare Pages（ささぴよさんの普段のスタック）/ GitHub Pages
  - [ ] **フレームワーク**: Waku（普段のスタック）/ Astro / プレーン HTML

### 0.5 ドキュメント

- [ ] README は **日英両方**書く（tcy と揃える）/ **日本語のみ** / **英語のみ**

---

## 1. リポジトリ構成（monorepo）

### 1.1 ディレクトリレイアウト

```
ptpt/
├── .github/
│   └── workflows/
│       ├── ci.yml             # PR で test + build
│       └── release.yml        # changesets でリリース
├── packages/
│   ├── ptpt-core/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── cell.ts        # Cell 実装
│   │   │   ├── board.ts       # Board 実装
│   │   │   ├── frame.ts       # Frame 型とファクトリ
│   │   │   ├── path.ts        # computeFlipPath 純粋関数
│   │   │   ├── normalize.ts   # FrameInput → Frame 正規化
│   │   │   ├── styles.css     # 既定 CSS(オプショナル import)
│   │   │   ├── presets/
│   │   │   │   ├── _types.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── default.ts
│   │   │   │   ├── alphanumeric.ts
│   │   │   │   ├── digits.ts
│   │   │   │   └── alpha.ts
│   │   │   └── delays/
│   │   │       ├── index.ts
│   │   │       ├── uniform.ts
│   │   │       ├── random.ts
│   │   │       └── wave.ts
│   │   ├── tests/
│   │   │   ├── path.test.ts
│   │   │   ├── normalize.test.ts
│   │   │   ├── frame.test.ts
│   │   │   ├── cell.test.ts   # happy-dom で DOM テスト
│   │   │   └── board.test.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── README.md
│   ├── ptpt-react/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── Patapata.tsx       # <Patapata frames={...} target={...} />
│   │   │   ├── PatapataBoard.tsx  # <PatapataBoard cells={[...]} />
│   │   │   └── useFlipCell.ts     # フック版
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── README.md
│   └── ptpt-vue/
│       └── ...
├── examples/
│   └── (デモアプリを置く場合)
├── docs/
│   ├── DESIGN.md            # このリポジトリの設計仕様
│   ├── EXAMPLES.md
│   └── IMPLEMENTATION.md    # このファイル
├── .changeset/              # changesets 用
├── .gitignore
├── .npmignore
├── biome.json               # Linter/Formatter(Biome 推奨、ESLint+Prettier より高速)
├── bun.lock                 # Bun v1.2 以降はテキストベース(JSONC)
├── LICENSE
├── package.json             # ルート(workspaces 定義)
├── README.md                # トップREADME(日英)
└── tsconfig.base.json       # 共通 tsconfig
```

### 1.2 ルート `package.json`

```json
{
  "name": "ptpt-monorepo",
  "private": true,
  "workspaces": ["packages/*", "examples/*"],
  "scripts": {
    "build": "bun run --filter='./packages/*' build",
    "test": "bun run --filter='./packages/*' test",
    "typecheck": "bun run --filter='./packages/*' typecheck",
    "lint": "biome check .",
    "format": "biome format --write .",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "bun run build && changeset publish"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.x",
    "@changesets/cli": "^2.x",
    "typescript": "^5.x",
    "vite": "^8.x",
    "vite-plugin-dts": "^4.x",
    "vitest": "^2.x",
    "happy-dom": "^15.x"
  }
}
```

### 1.3 `ptpt-core/package.json`

```json
{
  "name": "@love-rox/ptpt-core",
  "version": "0.1.0",
  "description": "Split-flap display library for the web. Framework-agnostic core.",
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./presets": {
      "types": "./dist/presets/index.d.ts",
      "import": "./dist/presets/index.js"
    },
    "./presets/*": {
      "types": "./dist/presets/*.d.ts",
      "import": "./dist/presets/*.js"
    },
    "./delays": {
      "types": "./dist/delays/index.d.ts",
      "import": "./dist/delays/index.js"
    },
    "./delays/*": {
      "types": "./dist/delays/*.d.ts",
      "import": "./dist/delays/*.js"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist", "README.md"],
  "sideEffects": ["**/*.css"],
  "scripts": {
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "keywords": ["split-flap", "flipboard", "patapata", "solari", "vestaboard"],
  "repository": { "type": "git", "url": "git+https://github.com/Love-Rox/ptpt.git", "directory": "packages/ptpt-core" }
}
```

依存ゼロを守る。`peerDependencies` も無し。

### 1.4 `ptpt-core/vite.config.ts`

ライブラリビルド用の Vite 設定。複数エントリ(本体 + presets/* + delays/*)で出力する。

```ts
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      rollupTypes: false,  // 各エントリで個別の d.ts を出す
      entryRoot: 'src',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'presets/index': resolve(__dirname, 'src/presets/index.ts'),
        'presets/default': resolve(__dirname, 'src/presets/default.ts'),
        'presets/alphanumeric': resolve(__dirname, 'src/presets/alphanumeric.ts'),
        'presets/digits': resolve(__dirname, 'src/presets/digits.ts'),
        'presets/alpha': resolve(__dirname, 'src/presets/alpha.ts'),
        'delays/index': resolve(__dirname, 'src/delays/index.ts'),
        'delays/uniform': resolve(__dirname, 'src/delays/uniform.ts'),
        'delays/random': resolve(__dirname, 'src/delays/random.ts'),
        'delays/wave': resolve(__dirname, 'src/delays/wave.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      // 外部依存ゼロを維持
      external: [],
    },
    sourcemap: true,
    target: 'es2022',
  },
})
```

CSS は別途 `src/styles.css` をそのままコピーして配布する。Vite はライブラリモードで CSS を自動で含めない(コアは依存ゼロを守りたいため)。ビルド後に `cp src/styles.css dist/styles.css` を `build` スクリプトに足すか、Vite のカスタムプラグインで対応する。

### 1.5 `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

---

## 2. 実装順序（推奨）

設計を全部一度に書き始めるのではなく、内側から外側へ。各ステップでテストを書きながら進める。

### Step 1: 純粋関数とデータ型

依存なし、テストしやすい。

1. `src/frame.ts`: `Frame` 型定義、`text` / `image` / `element` ファクトリ
2. `src/normalize.ts`: `FrameInput[] → Frame[]` の正規化（string → text frame）
3. `src/path.ts`: `computeFlipPath(frames, fromSlug, toSlug, options): number[]`
4. `src/presets/*`: 4 つのプリセット定義
5. `src/delays/*`: 3 つの delay 関数

**テスト**: `frame.test.ts`, `normalize.test.ts`, `path.test.ts`。DOM 不要、純粋関数のみで完結。

### Step 2: Cell（1セル）

DOM 操作層。プロトタイプ HTML の `Cell` クラスを TypeScript に移植 + 拡張。

1. `src/cell.ts`: `createCell(element, options): Cell` を実装
2. アニメーション仕様は `DESIGN.md` セクション 6 に厳密に従う（3要素方式 + シャドウ）
3. `src/styles.css`: 既定スタイルを CSS ファイルとして書き出し
4. flipTo の `replace` / `queue` モード両対応

**テスト**: `cell.test.ts`（happy-dom）。`flipTo` 後に正しい `current` 値になること、replace で上書きが効くこと、queue で順番に消化されることを検証。

### Step 3: Board（複数セル）

1. `src/board.ts`: `createBoard(cells, options): Board`
2. `delayFn` を適用してセルごとに `flipTo` を時間差呼び出し
3. a11y 属性の管理（`aria-live`, `aria-label`, `aria-busy`）
4. `announceTiming` の 3 モード（`after` / `immediate` / `both`）対応
5. `ariaLabelFormatter` のデフォルト実装と差し替え機構

**テスト**: `board.test.ts`。複数セル一括 flip、a11y 属性の正しい変化、delay の効き方を検証。

### Step 4: 公開 API の整理

1. `src/index.ts`: 全公開 API を re-export
2. JSDoc コメントを付ける（IDE のヒント表示用）
3. `README.md` の基本的な使用例（インストール、最小コード）

### Step 5: React ラッパー

1. `packages/ptpt-react/src/Patapata.tsx`: `<Patapata frames={...} target={...} />`
2. `packages/ptpt-react/src/PatapataBoard.tsx`: 複数セルラッパー
3. `packages/ptpt-react/src/useFlipCell.ts`: 命令的 API が必要なケース用フック
4. `peerDependencies`: `react@>=18`, `@love-rox/ptpt-core@workspace:*`

**テスト**: `@testing-library/react` で基本的なレンダリングテスト。

### Step 6: Vue ラッパー（オプション）

React と同等の構成を Vue 3 Composition API で。

### Step 7: ドキュメントとリリース

1. ルート `README.md` の日英版
2. 各パッケージの `README.md`
3. `CHANGELOG.md`（changesets 自動生成）
4. `npm publish`（changesets 経由）

---

## 3. パッケージ別仕様

### 3.1 `@love-rox/ptpt-core` 公開 API

```ts
// === Frame ===
export type Frame = TextFrame | ImageFrame | ElementFrame
export type TextFrame = { slug: string; type: 'text'; value: string }
export type ImageFrame = { slug: string; type: 'image'; src: string; alt?: string; width?: number; height?: number }
export type ElementFrame = { slug: string; type: 'element'; node: HTMLElement }
export type FrameInput = string | Frame

export function text(value: string): TextFrame
export function text(slug: string, value: string): TextFrame
export function image(slug: string, src: string, options?: { alt?: string; width?: number; height?: number }): ImageFrame
export function element(slug: string, node: HTMLElement): ElementFrame

// === Cell ===
export type CellOptions = {
  preset?: PresetDefinition | string
  frames?: FrameInput[]
  durationPerFlap?: number       // default 200
  direction?: 'forward' | 'shortest'   // default 'forward'
  reducedMotion?: 'instant' | 'minimal' | 'ignore'  // default 'instant'
  imageRenderer?: 'dom'          // v1 は 'dom' のみ
}
export type FlipOptions = { mode?: 'replace' | 'queue' }
export type Cell = {
  flipTo(slug: string, options?: FlipOptions): Promise<void>
  destroy(): void
  readonly current: string
  readonly element: HTMLElement
}
export function createCell(element: HTMLElement, options?: CellOptions): Cell

// === Board ===
export type BoardOptions = {
  delayFn?: (index: number, total: number) => number
  announceTiming?: 'after' | 'immediate' | 'both'
  ariaLabelFormatter?: (frames: Frame[]) => string
}
export type Board = {
  flipTo(slugs: (string | null)[] | string, options?: FlipOptions): Promise<void>
  destroy(): void
  readonly cells: readonly Cell[]
  readonly element: HTMLElement
}
export function createBoard(cells: Cell[], options?: BoardOptions): Board

// === 純粋関数 ===
export function computeFlipPath(
  frames: Frame[],
  fromSlug: string,
  toSlug: string,
  options?: { direction?: 'forward' | 'shortest' }
): number[]

// === ヘルパ ===
export function frameText(frame: Frame): string
// text→value, image→alt(なければslug), element→aria-label(なければ'')
```

### 3.2 `@love-rox/ptpt-core/presets/*` の型

```ts
// presets/_types.ts
export type PresetDefinition = {
  name: string
  chars: string
  description: string
  recommendedDuration?: number
  locale?: string
}

// presets/default.ts
export const defaultPreset: PresetDefinition = {
  name: 'default',
  chars: " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;'\"-+/?!&@#$%*",
  description: 'Solari di Udine 系の英数字 + 記号プリセット。全63フラップ。',
  recommendedDuration: 200,
}
```

### 3.3 `@love-rox/ptpt-core/delays/*` の型

```ts
// delays/_types.ts
export type DelayFn = (index: number, total: number) => number

// delays/uniform.ts
export const uniform = (): DelayFn => () => 0

// delays/random.ts
export const random = (maxMs: number): DelayFn => () => Math.random() * maxMs

// delays/wave.ts
export const wave = (options: { direction?: 'ltr' | 'rtl'; step?: number }): DelayFn => {
  const { direction = 'ltr', step = 50 } = options
  return (index, total) => (direction === 'ltr' ? index : total - 1 - index) * step
}
```

### 3.4 `@love-rox/ptpt-react` 公開 API

```tsx
import type { CellOptions, BoardOptions, FlipOptions } from '@love-rox/ptpt-core'

// 単一セル
type PatapataProps = CellOptions & {
  target: string
  flipMode?: FlipOptions['mode']
  className?: string
  style?: React.CSSProperties
  onFlipComplete?: () => void
}
export function Patapata(props: PatapataProps): JSX.Element

// 複数セル
type PatapataBoardProps = BoardOptions & {
  cellOptions: CellOptions          // 全セル共通の設定
  cellOptionsOverride?: CellOptions[]  // セル別オーバーライド
  targets: (string | null)[] | string
  flipMode?: FlipOptions['mode']
  className?: string
  style?: React.CSSProperties
  onFlipComplete?: () => void
}
export function PatapataBoard(props: PatapataBoardProps): JSX.Element

// フック(命令的に操作したい場合)
type UseFlipCellReturn = {
  ref: React.RefObject<HTMLDivElement>
  flipTo: (slug: string, options?: FlipOptions) => Promise<void>
  current: string
}
export function useFlipCell(options?: CellOptions): UseFlipCellReturn
```

---

## 4. CSS 配布方針

コアは「DOM 構造を作る」ことに集中し、見た目は CSS で外部化する。CSS は2つの提供形態:

### 4.1 既定スタイル `styles.css`

`@love-rox/ptpt-core/styles.css` として import 可能。プロトタイプ HTML で使った CSS をそのまま提供。これを import すれば「とりあえず動く見た目」が得られる。

### 4.2 ヘッドレス利用

styles.css を import せず、ユーザーが自分で CSS を書く。コアは特定のクラス名（`.ptpt-cell`, `.ptpt-half`, `.ptpt-top`, etc.）を DOM に付けるので、ユーザーはそれをセレクタに使う。

`DESIGN.md` セクション 6 の CSS 概形をドキュメントに転載しておく。

---

## 5. テスト戦略

### 5.1 ユニットテスト（純粋関数）

`vitest run` で実行。DOM 不要。

- `computeFlipPath`: 各種パスケース（forward / shortest、起点と終点が同じ、wrap-around）
- `normalize`: string → text frame、Frame オブジェクトはパススルー、重複 slug は throw
- `text` / `image` / `element` ファクトリ: オーバーロード判定、型推論
- delay 関数: 各プリセットの出力値

### 5.2 DOM テスト（happy-dom）

`vitest` の environment を `happy-dom` に設定。

- `createCell`: 要素に正しい DOM 構造が生成されるか
- `cell.flipTo`: `current` 値が正しく更新されるか、Promise の解決タイミング
- `replace` モード: 進行中の `flipTo` を上書きできるか、Promise 解決ルール
- `queue` モード: 順番に消化されるか
- `createBoard`: a11y 属性（`role`, `aria-live`, `aria-label`, `aria-busy`）の変化
- `announceTiming`: 3モードでの aria-label 更新タイミング

### 5.3 視覚回帰テスト（v1 ではスコープ外）

Playwright や Chromatic での視覚回帰は v1 では持たない。プロトタイプ HTML を手動で確認する運用。v1.x で検討。

### 5.4 React テスト

`@testing-library/react` + `vitest`（happy-dom）。

- `<Patapata>` のレンダリング
- `target` prop の変化で flipTo が呼ばれるか
- `onFlipComplete` コールバックが正しく発火するか

---

## 6. CI / リリース

### 6.1 CI (`ci.yml`)

PR ごとに:
- `bun install`
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run build`

### 6.2 リリース (changesets)

```bash
bun changeset             # 変更内容を記述
bun changeset version     # version bump + CHANGELOG 更新
bun run release           # build + publish
```

`Love-Rox/tcy` と同じ流儀。

---

## 7. v0.1.0 完成の判定基準（Definition of Done）

以下が揃ったら v0.1.0 として npm 公開:

- [ ] `@love-rox/ptpt-core` 公開 API すべて実装
- [ ] 純粋関数のテストカバレッジ 90% 以上
- [ ] DOM テストで主要シナリオ（flipTo の基本、replace、queue、a11y 属性）がパス
- [ ] `@love-rox/ptpt-react` の最小 API（`<Patapata>`, `<PatapataBoard>`, `useFlipCell`）実装
- [ ] 各パッケージの README に「インストール → 最小コード → 動作確認」の流れが書かれている
- [ ] `styles.css` で「import するだけで動く」状態が確認できる
- [ ] ルート README に概要・特徴・各パッケージへのリンク
- [ ] LICENSE（MIT）
- [ ] CI が green

---

## 8. Claude Code に渡す時のプロンプト例

```
このリポジトリは ptpt(patapata)というスプリットフラップディスプレイの Web ライブラリです。
docs/DESIGN.md に設計仕様、docs/IMPLEMENTATION.md に実装計画があります。
まず docs/IMPLEMENTATION.md セクション 2「実装順序」の Step 1 から進めてください。

各ステップの完了基準:
- 型と関数のシグネチャが IMPLEMENTATION.md セクション 3 と一致すること
- テストファイルが対応する src ファイルと並列に存在し、`bun run test` がパスすること
- `bun run typecheck` と `bun run lint` がパスすること

ステップごとにコミットを分けてください。コミットメッセージは「feat(core): add computeFlipPath」のような conventional commits 形式で。

実装中に DESIGN.md または IMPLEMENTATION.md の記述に曖昧さや矛盾を見つけた場合は、勝手に解釈せず、ユーザーに確認してください。
```

---

## 9. 未決事項（実装中に判明したら追記）

- [ ] `cell.destroy()` の挙動：進行中のフリップを reject するか、放置するか
- [ ] `cell.clear()` の公開 API としての提供（v1 で必要？v1.x 送り？）
- [ ] CSS の `@property` を使って `--ptpt-flip-duration` を型付きで定義するか（モダンブラウザ限定機能）
- [ ] React Server Components 対応（Patapata は client-only なので 'use client' を付ける必要あり）
