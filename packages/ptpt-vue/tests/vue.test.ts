import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { Patapata } from '../src/Patapata'
import { PatapataBoard } from '../src/PatapataBoard'
import { useFlipCell } from '../src/useFlipCell'

/** Poll until `check` passes (flips resolve via short timers). */
async function until(check: () => boolean, timeout = 1000): Promise<void> {
  const start = Date.now()
  while (!check()) {
    if (Date.now() - start > timeout) throw new Error('until: timed out')
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

describe('Patapata', () => {
  it('builds a cell and flips to the target', async () => {
    const wrapper = mount(Patapata, {
      props: { preset: 'ABCDE', durationPerFlap: 2, target: 'C' },
    })
    expect(wrapper.find('.ptpt-cell').exists()).toBe(true)
    await until(() => wrapper.find('.ptpt-top .glyph').text() === 'C')
    await until(() => wrapper.emitted('flipComplete') != null)
  })

  it('flips again when target changes', async () => {
    const wrapper = mount(Patapata, {
      props: { preset: 'ABCDE', durationPerFlap: 2, target: 'B' },
    })
    await until(() => wrapper.find('.ptpt-top .glyph').text() === 'B')
    await wrapper.setProps({ target: 'E' })
    await until(() => wrapper.find('.ptpt-top .glyph').text() === 'E')
  })
})

describe('PatapataBoard', () => {
  it('renders one cell per target and announces the result', async () => {
    const wrapper = mount(PatapataBoard, {
      props: { cellOptions: { preset: '0123456789', durationPerFlap: 2 }, targets: '42' },
    })
    expect(wrapper.findAll('.ptpt-cell')).toHaveLength(2)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    await until(() => wrapper.find('[role="status"]').element.getAttribute('aria-label') === '4 2')
  })
})

describe('useFlipCell', () => {
  const Demo = defineComponent({
    setup() {
      const { ref: el, flipTo, current } = useFlipCell({ preset: 'ABCDE', durationPerFlap: 2 })
      return () =>
        h('div', [
          h('div', { ref: el, class: 'host' }),
          h('span', { class: 'cur' }, current.value),
          h('button', { onClick: () => flipTo('D') }, 'go'),
        ])
    },
  })

  it('exposes a ref and imperative flipTo', async () => {
    const wrapper = mount(Demo)
    await until(() => wrapper.find('.cur').text() === 'A')
    await wrapper.find('button').trigger('click')
    await until(() => wrapper.find('.cur').text() === 'D')
  })
})
