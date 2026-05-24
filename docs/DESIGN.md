# ptpt (patapata) — Design Document

スプリットフラップディスプレイ（パタパタ）を Web で扱うためのライブラリ。空港の発車標、Solari di Udine、Vestaboard のような体験をデジタルで再現する。

**命名**: プロジェクトの愛称は「パタパタ」、パッケージ識別子は `ptpt`（母音を抜いた省略形）。姉妹ライブラリの `tcy`（tate-chu-yoko）と同じ命名規則。

---

## 1. 設計思想

### コンセプト

- **「待たないと出ない」むず痒さの体験再現**: パタパタの本質は時間と物理性。効率化ではなく、わざと多めのフラップを抱えてアナログらしさを表現する。
- **文字と画像を同じ語彙で扱える**: セルにはテキストも画像も並べられる。
- **どこにでも貼れる**: framework-agnostic なコアを軸に、各フレームワーク用ラッパーは薄く保つ。

### 参照する哲学: `@love-rox/tcy-core`

- 依存ゼロ
- 純粋関数 + 薄い DOM 操作層
- 必要に応じてラッパーを足す構成
- ESM only、TypeScript 製、`.d.ts` 同梱
- バンドルサイズ目標: コア **5KB gzipped 以下**

---

## 2. パッケージ構成

monorepo (pnpm workspaces) で以下を提供する。

```
ptpt/
├── packages/
│   ├── ptpt-core/      # framework-agnostic、依存ゼロ
│   ├── ptpt-react/     # React ラッパー（薄い）
│   ├── ptpt-vue/       # Vue ラッパー（薄い）
│   ├── ptpt-rehype/    # Markdown / HAST パイプライン
│   └── ptpt-astro/     # Astro integration
└── examples/
```

スコープは `@love-rox/ptpt-*` を想定。

### コアの責務

- 1セルのアニメーション（DOM 操作、コマ送り）
- 複数セル（Board）のオーケストレーション
- フリップシーケンスの計算（純粋関数として export）
- フレームの正規化（string → text frame への変換）
- a11y 属性の管理

### コアが持たないもの

- 画像処理パイプライン（Canvas 焼き込みは v1 では非対応）
- フレームワーク固有の API
- ステートマネージャー連携

---

## 3. Frame 設計

### 型定義

```ts
type Frame =
  | { slug: string; type: 'text'; value: string }
  | { slug: string; type: 'image'; src: string; alt?: string; width?: number; height?: number }
  | { slug: string; type: 'element'; node: HTMLElement }  // 脱出ハッチ

type FrameInput = string | Frame  // string は text として正規化される
```

### slug ルール

- **必須**（識別子）
- **`text` 型の slug 省略時は `value` をそのまま slug として使う**
- **`image` / `element` は slug 明示が必須**
- Board 内で重複した slug を持つ Frame は禁止（コンストラクタで throw）
- **string 入力は常に text として扱う**（パスに見えても文字）

### ファクトリ関数

```ts
text(value): TextFrame                          // 省略形、slug = value
text(slug, value): TextFrame                    // 明示形
image(slug, src, options?): ImageFrame
element(slug, node): ElementFrame
```

### 記述例

```ts
// 一番カジュアル（英数字パタパタ）
frames: ['A', 'B', 'C']

// 混在
frames: ['A', 'B', image('sun', '/sun.png', { alt: '太陽' }), 'C']

// 明示形
frames: [
  text('a-red', 'A'),
  text('a-blue', 'A'),
  image('sun', '/sun.png', { alt: '太陽' }),
]
```

---

## 4. プリセット

### 設計方針

プリセットは「コア同梱の便利機能」であると同時に「**コミュニティが拡張する余地**」でもある。次の3点を守る:

- 1プリセット = 1ファイル（追加 PR のレビューが集中できる）
- 型付きオブジェクトとして定義（由来や推奨設定をメタとして持つ）
- tree-shakable な公開（プリセットが増えても、ユーザーのバンドルサイズは増えない）

### `PresetDefinition` 型

```ts
type PresetDefinition = {
  name: string                    // 識別子（'default', 'digits' 等）
  chars: string                   // フラップの並び順を表す文字列
  description: string             // 由来や意図の説明
  recommendedDuration?: number    // このプリセットでの推奨 durationPerFlap (ms)
  locale?: string                 // a11y 用の推奨 lang 属性値
}
```

### 提供プリセット

```ts
import { defaultPreset } from '@love-rox/ptpt-core/presets/default'
import { alphanumericPreset } from '@love-rox/ptpt-core/presets/alphanumeric'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'
import { alphaPreset } from '@love-rox/ptpt-core/presets/alpha'

// あるいはまとめて
import { presets } from '@love-rox/ptpt-core/presets'
// presets.default, presets.alphanumeric, ...
```

`defaultPreset` の中身:

```ts
{
  name: 'default',
  chars: " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;'\"-+/?!&@#$%*",
  description: 'Solari di Udine 系の英数字 + 記号プリセット。全63フラップ。',
  recommendedDuration: 200,
}
```

### プリセットの位置づけ

- `preset` と `frames` は排他
- `preset` 未指定 + `frames` 未指定 → `defaultPreset` が適用される
- `preset` は `PresetDefinition` または `string` を受け取る:
  - `PresetDefinition` を渡せばメタ情報も活用される（`recommendedDuration` が `durationPerFlap` のデフォルトに、`locale` が `aria` 属性のヒントに）
  - `string` を渡せば簡易記法として `chars` 相当のみ反映される
- プリセットの拡張も簡単: `preset: { ...defaultPreset, chars: defaultPreset.chars + '★♥' }`

### 三層のデフォルト戦略

1. **ゼロコンフィグ**: セル作るだけで `defaultPreset` が入る
2. **プリセット選択**: `{ preset: digitsPreset }`
3. **カスタム frames**: 画像を含む等、特殊な集合を持ちたいセルだけ

### ディレクトリ構造とコントリビューション

```
packages/ptpt-core/src/presets/
├── _types.ts          # PresetDefinition 型
├── index.ts           # 全プリセットを束ねた `presets` オブジェクト
├── default.ts
├── alphanumeric.ts
├── digits.ts
├── alpha.ts
└── README.md          # プリセット追加方法
```

`package.json` の `exports` でサブパス公開し、tree-shakable にする:

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./presets": "./dist/presets/index.js",
    "./presets/*": "./dist/presets/*.js"
  }
}
```

### コントリビュータ向けガイド（`presets/README.md` に記載）

- 新規プリセットは `<name>.ts` として追加し、`index.ts` に export を追加
- `description` には由来を書く（実機・既存システムへの参照があると採用されやすい）
- 同種でも用途が違うものは並存可（例: `alpha_lowercase`, `alpha_uppercase`）
- 任意で `examples/preset-gallery/` にデモを追加

---

## 5. コア API

### `createCell(element, options)`

セル1個を作る。

```ts
createCell(el, {
  preset?: PresetDefinition | string,           // デフォルト: defaultPreset
  frames?: FrameInput[],                        // preset と排他
  durationPerFlap?: number,                     // デフォルト 200ms（preset の recommendedDuration が優先される）
  direction?: 'forward' | 'shortest',           // デフォルト 'forward'
  reducedMotion?: 'instant' | 'minimal' | 'ignore',  // デフォルト 'instant'
  imageRenderer?: 'dom',                        // v1 は 'dom' のみ
})
```

### `cell.flipTo(slug, options?)`

セルを目標 slug までめくる。

```ts
cell.flipTo('Z')                          // デフォルト: replace モード
cell.flipTo('Z', { mode: 'queue' })       // キューに追加

type FlipMode = 'replace' | 'queue'       // v1。'immediate' は v2 以降
```

### `createBoard(cells, options?)`

複数セルを束ねる。

```ts
createBoard([cell1, cell2, ...], {
  delayFn?: (index, total) => number,           // セル間の遅延
  announceTiming?: 'after' | 'immediate' | 'both',  // a11y 通知タイミング
  ariaLabelFormatter?: (frames: Frame[]) => string,  // aria-label 集約方法
})
```

### `board.flipTo(slugs, options?)`

```ts
board.flipTo(['H', 'I', '5', 'sun'])            // 位置順の配列
board.flipTo(['H', 'I', null, 'sun'])           // null = そのセルは変えない
board.flipTo('HI')                              // 糖衣構文、内部で [...str]
board.flipTo(['H', 'I'], { mode: 'queue' })     // 全セルに同じモード適用
```

### delay プリセット

```ts
delays.uniform()
delays.random(maxMs)
delays.wave({ direction: 'ltr', step: 50 })
```

### 純粋関数（コアから export）

```ts
computeFlipPath(frames, fromIndex, toIndex, { direction }): number[]
```

---

## 6. アニメーション仕様

### DOM 構造（3要素方式）

```html
<div class="ptpt-cell">
  <!-- 上半分の背景: 次の文字の上半分を待機させておくプレビュー層 -->
  <div class="ptpt-half ptpt-top-preview">
    <div class="glyph">次の文字</div>
  </div>

  <!-- 下半分: 現在 → 次へ textContent で切り替える -->
  <div class="ptpt-half ptpt-bottom">
    <div class="glyph">現在の文字</div>
  </div>

  <!-- 上半分の手前: 現在の文字を持ち、フリップ時に倒れて消える -->
  <div class="ptpt-half ptpt-top">
    <div class="glyph">現在の文字</div>
  </div>
</div>
```

各 `.ptpt-half` は `overflow: hidden` で半分サイズの box。内部の `.glyph` はセル全高の領域で文字を中央配置し、上半分の box では top:0、下半分の box では bottom:0 で配置することで、文字の上半分 / 下半分だけが見えるようになる。

#### 役割の分担

- **`.ptpt-top-preview`**: 静止背景。常に「次に表示される文字」の上半分を持つ。普段は `.ptpt-top` に覆われて見えない。`.ptpt-top` が倒れて消える過程で透けて見えるようになる
- **`.ptpt-top`**: 「現在表示されている上半分」。フリップ時にだけ `transform: rotateX()` で倒れる
- **`.ptpt-bottom`**: 「現在表示されている下半分」。フリップの途中で textContent が次の値に切り替わる

### フリップアニメーション

1コマのフリップ全体は **`durationPerFlap`(デフォルト 200ms)** で完了する。

#### タイムライン

| 時刻 | `.ptpt-top` | `.ptpt-bottom` | `.ptpt-top-preview` |
|------|---|---|---|
| 0% | rotateX(0deg)、現在の文字 | 現在の文字 | 次の文字を仕込み済 |
| 50%（ピーク） | rotateX(-50deg)、box-shadow が下方向に最大、フラップが下半分の前面に覆い被さって見える | 次の文字に切り替え | 透け始める |
| 100% | rotateX(-90deg)、消失 | 次の文字 | 次の文字（このまま静止背景として残る） |
| 完了後 | rotateX(0deg) にリセット + 次の文字を仕込み | （変化なし） | （変化なし） |

#### 視覚演出のキモ

- **box-shadow による「重み」**: フリップ中の `.ptpt-top` に、下方向へ伸びる box-shadow をかける。50% 地点でシャドウが最大になり、フラップが下半分に物理的に覆い被さるような視覚効果を生む
- **下半分の切り替えタイミング**: シャドウのピークと一致させる（フリップ 50% 地点）。これにより「フラップが下に降りてきた瞬間、その下に既に次の文字がある」物理パタパタに近い感覚になる

#### CSS の概形

```css
.ptpt-cell {
  width: var(--ptpt-width, 80px);
  height: var(--ptpt-height, 120px);
  position: relative;
  perspective: 400px;
}

.ptpt-half {
  position: absolute;
  left: 0; right: 0;
  height: 50%;
  overflow: hidden;
}

.ptpt-top         { top: 0; transform-origin: bottom; z-index: 2; }
.ptpt-top-preview { top: 0; z-index: 1; }
.ptpt-bottom      { bottom: 0; z-index: 1; }

.glyph {
  position: absolute;
  height: var(--ptpt-height);
  line-height: var(--ptpt-height);
  text-align: center;
}
.ptpt-top .glyph, .ptpt-top-preview .glyph { top: 0; }
.ptpt-bottom .glyph { bottom: 0; }

.ptpt-cell.flipping .ptpt-top {
  animation: ptpt-flip var(--ptpt-flip-duration, 200ms) ease-in forwards;
}

@keyframes ptpt-flip {
  0%   { transform: rotateX(0deg);   box-shadow: 0 0 0 transparent;          }
  50%  { transform: rotateX(-50deg); box-shadow: 0 20px 30px -5px rgba(0,0,0,0.6); }
  100% { transform: rotateX(-90deg); box-shadow: 0 0 0 transparent;          }
}
```

### Promise の解決タイミング

`cell.flipTo()` / `board.flipTo()` が返す Promise は、**最後のフリップアニメーションが完全に終わって静止した瞬間**に resolve する。

```ts
await cell.flipTo('Z')  // Z まで到達し、フラップが完全に静止してから次へ
```

### 連続呼び出しの挙動（FlipMode）

| Mode | 挙動 |
|------|------|
| `replace`（デフォルト） | 進行中のコマだけ完走させ、現在見えているフレームから新目標へ方向転換 |
| `queue` | 進行中のフリップが完全に終わるまで待ち、順番に消化 |
| `immediate` | v1 では非対応（v2 以降検討） |

### Promise の解決ポリシー

- **暗黙キャンセル（`replace` による上書き）**: 上書きされた古い Promise も、**最新の目標到達時に resolve**
- **明示キャンセル（`cell.clear()`）**: 進行中の Promise は **reject**

### サイズ・スタイル

CSS カスタムプロパティで制御。コアはハードコードしない:

```css
.ptpt-cell {
  --ptpt-width: 80px;
  --ptpt-height: 120px;
  --ptpt-flip-duration: 200ms;
}
```

`durationPerFlap` の推奨値は 50ms〜400ms。プロトタイプ検証では 20ms でも破綻せずに動作することを確認済み。ただし 50ms 以下は人間の視覚でフリップとして認識できなくなり、シャドウのピークも知覚困難になる。「待つ味」を活かす場合は 150〜250ms が良い。

### 画像フレームの扱い

画像フレーム（`{ type: 'image' }`）も同じ3要素構造で扱う。`.glyph` の中身を `<img>` に置き換え、`object-fit: cover` と `object-position` で上下半分を切り出す:

```css
.ptpt-half .glyph img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ptpt-top .glyph img, .ptpt-top-preview .glyph img { object-position: top; }
.ptpt-bottom .glyph img { object-position: bottom; }
```

### v2 で 4要素方式への拡張余地

3要素方式は「上が倒れて消える + 下が切り替わる」の片方向アニメーション。物理的により正確な「上倒れ → 下起き上がり」の双方向アニメーションを表現するには 4要素方式が必要。これは v2 以降のオプション（`animationStyle: 'simple' | 'physical'`）として検討。

---

## 7. 画像レンダリング

v1 は **DOM ベース方式のみ**。

### 方式: `<img>` + `overflow: hidden`

3要素それぞれの `.glyph` に `<img>` を配置し、`overflow: hidden` と `object-position` で上下半分を切り出す（具体的な CSS はセクション 6 末尾参照）。

3 つの `<img>` 要素を持つことになるが、同じ src ならブラウザがキャッシュ・再利用するため、実効メモリは 1 枚分。

### この方式を選んだ理由

- tcy 哲学（画像処理パイプラインを持たない、ブラウザ標準だけで完結）
- コアの依存ゼロを保てる
- 画像差し替えが軽い
- `<img alt>` がそのまま a11y で効く

### v2 以降の拡張余地

- `imageRenderer: 'canvas'` オプション（ピクセルパーフェクト、エフェクト対応）
- `svg` 型 frame
- `video` 型 frame

### `element` 型の扱い

`{ type: 'element', node: ... }` は内部で `cloneNode(true)` して 3 箇所（top-preview / top / bottom）に配置する。

**制約**（ドキュメント明記）:
- イベントリスナーは複製されない
- フォーム要素の状態は複製されない
- 動的に変化する DOM（video, Canvas）は同期しない

---

## 8. アクセシビリティ

### Board の構造

```html
<div class="ptpt-board" 
     role="status" 
     aria-live="polite" 
     aria-atomic="true"
     aria-label="HELLO"
     aria-busy="false">
  <div class="ptpt-cell" aria-hidden="true">...</div>
  <div class="ptpt-cell" aria-hidden="true">...</div>
</div>
```

- 各セルは `aria-hidden="true"`（フリップ中の中間状態を支援技術に見せない）
- Board の `aria-label` を JS で更新（最終結果のみ通知）
- フリップ中は `aria-busy="true"`

### announceTiming オプション

```ts
createBoard([...], {
  announceTiming: 'after' | 'immediate' | 'both'  // デフォルト 'after'
})
```

| 値 | 挙動 |
|----|------|
| `after`（デフォルト） | **最新の目標に到達したフリップが完全終了**したタイミングで `aria-label` を更新 |
| `immediate` | `flipTo` 開始時に即座に更新。情報優先 |
| `both` | 開始時に予告 + 終了時に確定 |

#### `after` モードの厳密な挙動

`replace` モードで `flipTo` が連続して呼ばれた場合、**中間の目標は aria-label に反映されない**。常に「最新の目標」のみが追跡される:

1. `flipTo('A')` 呼ばれる → 内部の「予約目標」が `'A'`
2. アニメ進行中に `flipTo('B')` 呼ばれる → 予約目標が `'B'` に置き換わる（`'A'` は捨てられる）
3. `'B'` まで到達してフリップ完全終了 → ここで初めて `aria-label` 更新

これにより、ストップウォッチや株価ティッカーのような **連続更新ユースケースでも aria-label が必ず更新される**ことが保証される（ただし更新タイミングは「連続更新が止まってから」になる）。

#### 連続更新ユースケースでのプラクティス

更新が高頻度で続き、視覚的にフリップが止まらないようなケースでは、`'after'` だと aria-label の更新が遅延し続ける可能性がある。リアルタイム情報を支援技術ユーザーに早く届けたい場合は `'immediate'` の使用も検討する:

```ts
// ストップウォッチや実況系のユースケース
createBoard([...], { announceTiming: 'immediate' })
```

### 画像 alt の集約

`text` の `value` と `image` の `alt` をデフォルトで空白区切り連結する。

```ts
board.flipTo(['H', 'sun', '!'])
// aria-label: "H 太陽 !"
```

カスタマイズしたい場合は `ariaLabelFormatter` を渡す:

```ts
createBoard([...], {
  ariaLabelFormatter: (frames) => frames.map(f =>
    f.type === 'text' ? f.value : f.alt
  ).join('')
})
```

### alt 省略時のフォールバック

- `alt` が指定されていない `image` フレームは **slug にフォールバック**
- **dev 環境ではコンソール警告**を出す

### reduced-motion との連動

| `reducedMotion` 設定 | 挙動 |
|---|---|
| `instant` | アニメーションなし。`aria-busy` は付けない。`aria-label` は即座に更新 |
| `minimal` | 短時間のアニメ。`aria-busy` 短時間 ON |
| `ignore` | 通常通り |

自動連動するので、ユーザーは `reducedMotion` だけ指定すれば良い。

### キーボード / フォーカス

- パタパタ自体はデフォルトでフォーカス不可（`tabindex` 付与しない）
- インタラクティブにしたい場合はユーザー側で `tabindex` / `role` を追加
- Board の `role="status"` と `role="button"` が混在する場合の注意点はドキュメントで明記

### 言語属性

- コアは `lang` 属性を自動設定しない
- ユーザー責任で親要素に `lang` を付与してもらう（混在判定は誤判定リスク高）

---

## 9. v1 スコープ外（将来検討）

| 機能 | 想定バージョン |
|------|---------------|
| `imageRenderer: 'canvas'` | v2 |
| `flipMode: 'immediate'` | v2 |
| `animationStyle: 'physical'`（4要素方式の双方向アニメ） | v2 以降 |
| `svg` 型 frame | v2 以降 |
| `video` 型 frame | 未定 |
| `cell.queue` / `cancelQueue` / `clear` の公開 API | v1.x で必要に応じて |
| プリセットの拡充（かな、ハングル、アラビア数字...） | v1.x |
| アニメーションプリセットの拡充 | v1.x |

---

## 10. 用語集

| 用語 | 意味 |
|------|------|
| ptpt | プロジェクト / パッケージ識別子。`patapata` の省略形 |
| patapata | プロジェクトの愛称。日本語で「パタパタ」とも呼ぶ |
| Frame | パタパタの1コマ（text / image / element のいずれか） |
| Cell | フリップする単位（1個のパタパタ） |
| Board | 複数の Cell を束ねたもの |
| Flap | 物理パタパタの1枚の板（メタファ）。Frame 1コマと対応 |
| slug | Frame を識別する文字列キー |
| FlipMode | 連続呼び出し時の挙動（`replace` / `queue` / `immediate`） |
