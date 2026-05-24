import { type Cell, type CellOptions, createCell, type FlipOptions } from '@love-rox/ptpt-core'
import { type PropType, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * A single split-flap cell as a Vue component.
 *
 * Accepts the {@link CellOptions} as props (read once on mount) plus a `target`
 * to flip to. `class` / `style` fall through to the root element. Emits
 * `flipComplete` after each flip settles.
 *
 * @example
 * ```vue
 * <Patapata :preset="digitsPreset" target="7" @flip-complete="onDone" />
 * ```
 */
export const Patapata = defineComponent({
  name: 'Patapata',
  props: {
    /** Slug to flip to whenever it changes. */
    target: { type: String, required: true },
    preset: {
      type: [Object, String] as PropType<NonNullable<CellOptions['preset']>>,
      default: undefined,
    },
    frames: { type: Array as PropType<NonNullable<CellOptions['frames']>>, default: undefined },
    durationPerFlap: { type: Number, default: undefined },
    direction: {
      type: String as PropType<NonNullable<CellOptions['direction']>>,
      default: undefined,
    },
    reducedMotion: {
      type: String as PropType<NonNullable<CellOptions['reducedMotion']>>,
      default: undefined,
    },
    flipMode: {
      type: String as PropType<NonNullable<FlipOptions['mode']>>,
      default: undefined,
    },
  },
  emits: ['flipComplete'],
  setup(props, { emit }) {
    const el = ref<HTMLDivElement | null>(null)
    let cell: Cell | null = null

    function flip(): void {
      if (!cell) return
      const active = cell
      active
        .flipTo(props.target, props.flipMode ? { mode: props.flipMode } : undefined)
        .then(() => emit('flipComplete'))
        .catch(() => {
          /* destroyed mid-flip; ignore */
        })
    }

    onMounted(() => {
      if (!el.value) return
      const options: CellOptions = {}
      if (props.preset !== undefined) options.preset = props.preset
      if (props.frames !== undefined) options.frames = props.frames
      if (props.durationPerFlap !== undefined) options.durationPerFlap = props.durationPerFlap
      if (props.direction !== undefined) options.direction = props.direction
      if (props.reducedMotion !== undefined) options.reducedMotion = props.reducedMotion
      cell = createCell(el.value, options)
      flip()
    })

    watch(() => props.target, flip)

    onBeforeUnmount(() => {
      cell?.destroy()
      cell = null
    })

    return () => h('div', { ref: el })
  },
})
