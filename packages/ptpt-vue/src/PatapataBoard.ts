import {
  type Board,
  type BoardOptions,
  type CellOptions,
  createBoard,
  createCell,
  type FlipOptions,
} from '@love-rox/ptpt-core'
import { type PropType, computed, defineComponent, h, onBeforeUnmount, onMounted, watch } from 'vue'

const targetsKey = (targets: (string | null)[] | string): string =>
  typeof targets === 'string' ? targets : targets.map((t) => t ?? ' ').join('')

/**
 * A board of split-flap cells as a Vue component.
 *
 * Renders one host element per target (count derived from `targets`), creates
 * the cells and board on mount, and flips when `targets` change. `class` /
 * `style` fall through to the root element. Emits `flipComplete`.
 *
 * @example
 * ```vue
 * <PatapataBoard :cell-options="{ preset: digitsPreset }" targets="042" />
 * ```
 */
export const PatapataBoard = defineComponent({
  name: 'PatapataBoard',
  props: {
    /** Options applied to every cell. */
    cellOptions: { type: Object as PropType<CellOptions>, required: true },
    /** Per-cell options merged over `cellOptions`. */
    cellOptionsOverride: { type: Array as PropType<CellOptions[]>, default: undefined },
    /** Targets: a per-position array (`null` keeps a cell) or a string. */
    targets: { type: [Array, String] as PropType<(string | null)[] | string>, required: true },
    flipMode: { type: String as PropType<NonNullable<FlipOptions['mode']>>, default: undefined },
    delayFn: {
      type: Function as PropType<NonNullable<BoardOptions['delayFn']>>,
      default: undefined,
    },
    announceTiming: {
      type: String as PropType<NonNullable<BoardOptions['announceTiming']>>,
      default: undefined,
    },
    ariaLabelFormatter: {
      type: Function as PropType<NonNullable<BoardOptions['ariaLabelFormatter']>>,
      default: undefined,
    },
  },
  emits: ['flipComplete'],
  setup(props, { emit }) {
    const count = computed(() =>
      typeof props.targets === 'string' ? [...props.targets].length : props.targets.length,
    )
    const hosts: (HTMLDivElement | null)[] = []
    let board: Board | null = null

    function build(): void {
      const slice = hosts.slice(0, count.value)
      if (slice.length !== count.value || slice.some((host) => host == null)) return
      const cells = (slice as HTMLDivElement[]).map((host, index) =>
        createCell(host, { ...props.cellOptions, ...props.cellOptionsOverride?.[index] }),
      )
      const boardOptions: BoardOptions = {}
      if (props.delayFn) boardOptions.delayFn = props.delayFn
      if (props.announceTiming) boardOptions.announceTiming = props.announceTiming
      if (props.ariaLabelFormatter) boardOptions.ariaLabelFormatter = props.ariaLabelFormatter
      board = createBoard(cells, boardOptions)
    }

    function flip(): void {
      if (!board) return
      const active = board
      active
        .flipTo(props.targets, props.flipMode ? { mode: props.flipMode } : undefined)
        .then(() => emit('flipComplete'))
        .catch(() => {
          /* destroyed mid-flip; ignore */
        })
    }

    onMounted(() => {
      build()
      flip()
    })

    watch(
      count,
      () => {
        board?.destroy()
        board = null
        build()
        flip()
      },
      { flush: 'post' },
    )

    watch(
      () => targetsKey(props.targets),
      () => flip(),
    )

    onBeforeUnmount(() => {
      board?.destroy()
      board = null
    })

    return () =>
      h(
        'div',
        Array.from({ length: count.value }, (_, index) =>
          h('div', {
            key: index,
            ref: (el) => {
              hosts[index] = (el as HTMLDivElement | null) ?? null
            },
          }),
        ),
      )
  },
})
