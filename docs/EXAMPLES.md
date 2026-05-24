# ptpt — Usage Examples

設計が実用に耐えるかを検証するための使用例集。各例はコメントで「設計のどこを使っているか」「気になった点」を記録する。

---

## 例1: シンプルなカウンタ（数字3桁）

クリックするとカウントアップする 0〜999 のカウンタ。

```ts
import { createCell, createBoard, presets } from '@love-rox/ptpt-core'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'

const root = document.getElementById('counter')!
root.innerHTML = `
  <div class="board"></div>
  <button>+1</button>
`
const boardEl = root.querySelector('.board')!
const button = root.querySelector('button')!

// 3桁分のセルを作る
const cells = Array.from({ length: 3 }, () => {
  const el = document.createElement('div')
  el.className = 'ptpt-cell'
  boardEl.appendChild(el)
  return createCell(el, { preset: digitsPreset })
})

const board = createBoard(cells)

let count = 0
button.addEventListener('click', () => {
  count = (count + 1) % 1000
  const padded = String(count).padStart(3, '0')
  board.flipTo(padded)  // 糖衣構文: '042' → ['0', '4', '2']
})

// 初期表示
board.flipTo('000')
```

```css
.board { display: flex; gap: 4px; }
.ptpt-cell {
  --ptpt-width: 48px;
  --ptpt-height: 72px;
}
```

**気になった点**:

- ✅ `digitsPreset` を import して渡すだけでセルが完成。シンプル
- ✅ `padStart(3, '0')` + `flipTo(string)` 糖衣構文の相性が良い
- ⚠️ セルを `Array.from` + ループで作るのが少し冗長。`createBoard` に「要素数と親要素を渡したら勝手にセルを作る」便利関数があると楽かも → **設計フィードバック1**

---

## 例2: 天気ボード（アイコン画像 + 気温）

3セル構成: 天気アイコン、気温の十の位、気温の一の位。

```ts
import { createCell, createBoard, text, image } from '@love-rox/ptpt-core'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'

const root = document.getElementById('weather')!
root.innerHTML = `
  <div class="cell-icon"></div>
  <div class="cell-tens"></div>
  <div class="cell-ones"></div>
  <span class="unit">℃</span>
`

// 天気アイコン用セル（画像が混じるのでカスタム frames）
const iconCell = createCell(root.querySelector('.cell-icon')!, {
  frames: [
    image('sunny', '/icons/sun.svg', { alt: '晴れ' }),
    image('cloudy', '/icons/cloud.svg', { alt: 'くもり' }),
    image('rainy', '/icons/rain.svg', { alt: '雨' }),
    image('snowy', '/icons/snow.svg', { alt: '雪' }),
  ],
})

// 気温の桁用セル
const tensCell = createCell(root.querySelector('.cell-tens')!, { preset: digitsPreset })
const onesCell = createCell(root.querySelector('.cell-ones')!, { preset: digitsPreset })

const board = createBoard([iconCell, tensCell, onesCell], {
  // aria-label の集約をカスタム: "晴れ 23℃" のように整形
  ariaLabelFormatter: (frames) => {
    const [icon, tens, ones] = frames
    const weatherName = icon.type === 'image' ? icon.alt : ''
    const temp = `${tens.type === 'text' ? tens.value : ''}${ones.type === 'text' ? ones.value : ''}`
    return `${weatherName} ${temp}℃`
  },
})

function update(weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy', temp: number) {
  const tens = Math.floor(temp / 10)
  const ones = temp % 10
  board.flipTo([weather, String(tens), String(ones)])
}

update('sunny', 23)
```

**気になった点**:

- ✅ 文字セルと画像セルが Board の中で混在できる。`board.flipTo([weather, '2', '3'])` で文字と画像 slug が同じ配列に並ぶ書き味は綺麗
- ✅ `ariaLabelFormatter` が「セル順序の意味を組み立てる」用途で生きる。"晴れ 23℃" は単純連結ではできない
- ⚠️ `ariaLabelFormatter` の中で `frame.type === 'image' ? frame.alt : ''` という分岐が冗長。**ヘルパ関数があると良い** → **設計フィードバック2**
- ⚠️ image 用セルに毎回 `frames` を組み立てるのが手間。**「画像セルのプリセット」も再利用できる仕組みが欲しい** → **設計フィードバック3**

---

## 例3: ストップウォッチ

100ms 単位で更新される MM:SS.s 形式のストップウォッチ。

```ts
import { createCell, createBoard, text } from '@love-rox/ptpt-core'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'

const root = document.getElementById('stopwatch')!
root.innerHTML = `
  <div class="cell"></div><div class="cell"></div>
  <span>:</span>
  <div class="cell"></div><div class="cell"></div>
  <span>.</span>
  <div class="cell"></div>
  <button class="start">Start</button>
  <button class="stop">Stop</button>
`

const cellEls = root.querySelectorAll<HTMLElement>('.cell')
const cells = Array.from(cellEls).map(el => createCell(el, {
  preset: digitsPreset,
  durationPerFlap: 40,  // ストップウォッチは速めにめくる
  reducedMotion: 'minimal',
}))
const board = createBoard(cells, {
  announceTiming: 'after',  // 連続更新なので読み上げは終了時のみ
})

let startTime = 0
let timer: number | null = null

function tick() {
  const elapsed = Date.now() - startTime
  const m = Math.floor(elapsed / 60000)
  const s = Math.floor((elapsed % 60000) / 1000)
  const ds = Math.floor((elapsed % 1000) / 100)
  const str =
    String(m).padStart(2, '0') +
    String(s).padStart(2, '0') +
    String(ds)
  // ⚠️ ここで問題: 100ms ごとに flipTo を呼ぶと、前回のフリップが終わる前に次が来る
  board.flipTo(str)  // replace モード（デフォルト）で自然に上書きされる
}

root.querySelector('.start')!.addEventListener('click', () => {
  startTime = Date.now()
  timer = setInterval(tick, 100)
})
root.querySelector('.stop')!.addEventListener('click', () => {
  if (timer) clearInterval(timer)
})

board.flipTo('00000')
```

**気になった点**:

- ✅ `replace` モードが効くユースケース。100ms ごとに新しい目標が来ても、現在のコマだけ完走して方向転換するので破綻しない
- ✅ `durationPerFlap: 40` で速度カスタマイズ可能
- ⚠️ **時刻文字列を作る部分が定型コード**。`formatTime` ヘルパが欲しい気もするが、これはユーザー領域なので OK
- ⚠️ 100ms 周期で `flipTo` 呼ぶと、1コマ 40ms × 数コマで間に合わない場合がある。**「目標が更新され続けても破綻しない」保証がある(`replace` のおかげ)のは設計が良い**
- 🚨 **重要な発見**: `announceTiming: 'after'` で「フリップ完全終了後に aria-label 更新」だが、**連続更新中はフリップが終わらない**ので aria-label が永遠に更新されない可能性がある → **設計フィードバック4**

---

## 例4: メッセージボード（Vestaboard 風 5×22 グリッド）

ユーザーが入力したメッセージを 5 行 × 22 列のグリッドで表示。

```ts
import { createCell, createBoard, presets, delays } from '@love-rox/ptpt-core'
import { defaultPreset } from '@love-rox/ptpt-core/presets/default'

const root = document.getElementById('message-board')!
root.innerHTML = `
  <div class="grid"></div>
  <textarea maxlength="110"></textarea>
  <button>Send</button>
`
const grid = root.querySelector('.grid')!
const textarea = root.querySelector('textarea')!
const button = root.querySelector('button')!

const ROWS = 5
const COLS = 22

// グリッドを作る
const cells: ReturnType<typeof createCell>[] = []
for (let r = 0; r < ROWS; r++) {
  const rowEl = document.createElement('div')
  rowEl.className = 'row'
  for (let c = 0; c < COLS; c++) {
    const cellEl = document.createElement('div')
    cellEl.className = 'ptpt-cell'
    rowEl.appendChild(cellEl)
    cells.push(createCell(cellEl, { preset: defaultPreset }))
  }
  grid.appendChild(rowEl)
}

const board = createBoard(cells, {
  // 波状アニメーション: 左上から右下へ広がる
  delayFn: (index) => {
    const r = Math.floor(index / COLS)
    const c = index % COLS
    return (r + c) * 30
  },
})

function send(message: string) {
  // 5行に折り返し、各行を 22文字にパディング
  const words = message.toUpperCase().split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).length > COLS) {
      lines.push(current.padEnd(COLS, ' '))
      current = word
    } else {
      current = current ? current + ' ' + word : word
    }
  }
  lines.push(current.padEnd(COLS, ' '))
  while (lines.length < ROWS) lines.push(' '.repeat(COLS))

  // 5行 × 22セル = 110 slug の配列に展開
  const slugs = lines.slice(0, ROWS).flatMap(line => [...line])
  board.flipTo(slugs)
}

button.addEventListener('click', () => send(textarea.value))
send('HELLO WORLD')
```

```css
.grid { display: grid; gap: 4px; }
.row  { display: flex; gap: 2px; }
```

**気になった点**:

- ✅ `delayFn` で波状アニメーションが綺麗に書ける
- ✅ 110個のセルでも `board.flipTo(slugs)` 一発で済むのは気持ちいい
- ⚠️ グリッドのセル生成が **また定型コード**。例1 と例3 でも同じことしている → **設計フィードバック1 を再確認**
- ⚠️ メッセージ → セル配列の変換が複雑。**Board 単位での「2次元位置 → 1次元 index」ヘルパがあると良い**かもしれない。が、これはユーザー領域でも妥当
- ⚠️ **`flipTo` に渡す `string[]` の各要素が必ず長さ 1 とは限らない**ことに注意が必要。今回は `[...line]` で文字単位に分解しているが、サロゲートペアや絵文字が混じると壊れる。**設計には影響しないが、ドキュメントで注意喚起すべき**

---

## 例5: 駅の発車標（時刻 + 種別 + 行先）

朝の通勤電車の発車標を再現。時刻4桁 + 種別アイコン + 行先3文字。

```ts
import { createCell, createBoard, text, image } from '@love-rox/ptpt-core'
import { digitsPreset } from '@love-rox/ptpt-core/presets/digits'
import { defaultPreset } from '@love-rox/ptpt-core/presets/default'

const root = document.getElementById('departure')!
root.innerHTML = `
  <div class="time"></div>
  <div class="kind"></div>
  <div class="destination"></div>
`

// 時刻 4桁
const timeCells = Array.from({ length: 4 }, () => {
  const el = document.createElement('div')
  el.className = 'ptpt-cell'
  root.querySelector('.time')!.appendChild(el)
  return createCell(el, { preset: digitsPreset })
})

// 列車種別（アイコン）
const kindCell = createCell(root.querySelector('.kind')!, {
  frames: [
    image('local',   '/train/local.svg',   { alt: '各駅停車' }),
    image('rapid',   '/train/rapid.svg',   { alt: '快速' }),
    image('express', '/train/express.svg', { alt: '特急' }),
  ],
})

// 行先（漢字3文字）
const destCells = Array.from({ length: 3 }, () => {
  const el = document.createElement('div')
  el.className = 'ptpt-cell'
  root.querySelector('.destination')!.appendChild(el)
  // 漢字なので独自プリセット
  return createCell(el, {
    frames: [
      text('東京', '東'), text('品川', '品'), text('新宿', '新'),
      text('渋谷', '渋'), text('池袋', '池'),
      text('京都', '京'), text('都', '都'), text('阪', '阪'),
      text('大', '大'), text('神戸', '神'), text('戸', '戸'),
      // ⚠️ ここが地獄: 「東京」「東」が両方必要だが slug をどう設計するか
    ],
  })
})

const board = createBoard([...timeCells, kindCell, ...destCells], {
  ariaLabelFormatter: (frames) => {
    const [h1, h2, m1, m2, kind, d1, d2, d3] = frames
    const time = `${h1.type === 'text' ? h1.value : ''}${h2.type === 'text' ? h2.value : ''}:${m1.type === 'text' ? m1.value : ''}${m2.type === 'text' ? m2.value : ''}`
    const kindName = kind.type === 'image' ? kind.alt : ''
    const dest = [d1, d2, d3].map(f => f.type === 'text' ? f.value : '').join('').trim()
    return `${time} ${kindName} ${dest}行`
  },
})

board.flipTo(['0', '7', '3', '0', 'express', '京', '都', ' '])
//                                           ↑ 「京都」の「京」と被って曖昧
```

**気になった点**:

- 🚨 **重大な発見**: **slug の一意性 vs 文字の重複** という根本的な問題が浮上
  - 「東京」用の「東」と「東北」用の「東」を別 slug にしたい場面がある
  - 同じセル内で `text('a', 'A')` と `text('b', 'A')` のような「同じ value で違う slug」は許容されている（設計通り）
  - しかし上のコード例の「京」のように、「単体の京」と「京都の京」を区別する必要があるかは**フレーム集合の設計次第**
  - これは **設計の問題ではなく、ユーザーの命名問題**。設計は十分に対応している
- ✅ `text(slug, value)` の **slug が日本語可** という前提は良かった。`text('京都', '京')` のように意味で命名できる
- ⚠️ **`ariaLabelFormatter` の中の `frame.type === 'text' ? frame.value : ''` 分岐が、もう3回目**。本格的にヘルパが必要 → **設計フィードバック2 を再確認**
- ⚠️ 「時刻部分の桁を別々のセルにする」のは慣れていれば自然だが、初見ユーザーは戸惑うかも。**ドキュメントで「桁分割」のパターンを紹介すべき**

---

## 設計フィードバック総括

実装してみて見えた改善ポイント:

### フィードバック1: グリッド生成ヘルパが欲しい

例1, 3, 4, 5 すべてで「DOM要素を作ってセル化する」定型コードが出現。

提案する追加 API:

```ts
// 親要素に N 個の子要素を生成し、それぞれセル化して返す
createCellGrid(parentEl, count, options): Cell[]

// 使用例
const cells = createCellGrid(boardEl, 3, { preset: digitsPreset })
const board = createBoard(cells)
```

または、Board に統合:

```ts
const board = createBoard.fromCount(boardEl, 3, { preset: digitsPreset })
```

どちらにせよ「セル個別の DOM 要素は内部で勝手に作る」モードがあると体験が良い。

ただし**ユーザーが任意の DOM 構造を組みたいケース**（例5の time / kind / destination のように離れたコンテナに分ける）もあるので、**今の低レベル API は残しつつ、高レベルヘルパを追加**が良い。

### フィードバック2: Frame 値取り出しヘルパ

`ariaLabelFormatter` の中で `frame.type === 'text' ? frame.value : ...` の分岐が頻出。

```ts
// 提案
import { frameText } from '@love-rox/ptpt-core'

frameText(frame)
// text → value
// image → alt（なければ slug）
// element → '' (or aria-label を読みに行く)
```

これがあると `ariaLabelFormatter` は:

```ts
ariaLabelFormatter: (frames) => frames.map(frameText).join(' ')
```

すっきり。実はこれは**デフォルトの集約ロジック**として既にコア内部にあるはずで、それを export するだけ。

### フィードバック3: 画像セルのプリセット化

例2 の天気アイコン、例5 の列車種別、それぞれで `frames: [image(...), image(...), ...]` を組み立てている。**画像セット自体を再利用したい**ケースがある。

```ts
// 提案
const weatherFrames = [
  image('sunny', '/sun.svg', { alt: '晴れ' }),
  image('cloudy', '/cloud.svg', { alt: 'くもり' }),
  // ...
]

const cell1 = createCell(el1, { frames: weatherFrames })
const cell2 = createCell(el2, { frames: weatherFrames })
```

**これは既にできる**（`frames` は単なる配列なので変数化すれば再利用可能）。よって**設計変更は不要**、ドキュメントで「画像セットを再利用するパターン」を紹介すれば良い。

### フィードバック4 (重要): 連続更新中の aria-label 更新タイミング

例3 のストップウォッチで発覚:

- `announceTiming: 'after'` = フリップ完全終了後に更新
- だが連続して `flipTo` が呼ばれると、フリップが終わる前に次が始まる
- 結果: aria-label が**永遠に更新されない**

これは設計の穴。対処案:

- **案A**: `replace` モードで上書きされた時点で「中間の目標」を捨て、最新目標で aria-label を予約。最新目標到達時に更新
- **案B**: aria-label 更新を debounce する（最後の `flipTo` から N ms 経ってから更新）
- **案C**: ユーザー側で `announceTiming: 'immediate'` を選んでもらう（連続更新ユースケースの推奨設定として明記）

**私の推し: 案A + 案C の併用**

`'after'` モードは「最新の目標が確定したら更新」を意味する、と再定義する。連続上書きでも、最新の目標は常に分かっているので、それで `aria-label` を即座に書き換えれば良い。視覚との同期は崩れるが、そもそも連続更新ユースケースでは視覚も「最新だけ追いついていく」のだから、聴覚も同じ挙動が自然。

ドキュメントには「連続更新では `'immediate'` も検討」と書く。

### フィードバック5 (発見): サロゲートペア / 絵文字の扱い

例4 で `[...line]` でメッセージを文字単位に分解しているが、`'👨‍👩‍👧'` のような ZWJ シーケンスは壊れる。

これは**コアの責務ではない**が、ドキュメントの「Tips」セクションに:

> `board.flipTo(string)` の糖衣構文は `[...string]` で分解されます。サロゲートペアや絵文字（ZWJ シーケンス含む）が混在する場合は、明示的に slug 配列で渡してください。

と書くべき。

---

## まとめ

5つの使用例を書いて、設計の妥当性はおおむね確認できた。

| フィードバック | 種類 | 対応 |
|------|------|------|
| 1. グリッド生成ヘルパ | API 追加 | v1 で `createCellGrid` を追加検討 |
| 2. Frame 値取り出しヘルパ | API export | `frameText` を export（実装は既にある想定） |
| 3. 画像セットの再利用 | ドキュメント | パターン紹介で対応 |
| 4. 連続更新の aria-label | **設計修正** | `'after'` モードを「最新目標到達で更新」に再定義 |
| 5. サロゲートペア | ドキュメント | Tips セクションで注意喚起 |

**設計修正が必要なのは4のみ**。これは DESIGN.md の a11y セクション（`announceTiming` 説明）に追記すべき。
