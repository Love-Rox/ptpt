import { rehype } from 'rehype'
import { describe, expect, it } from 'vitest'
import { hydrate } from '../src/client'
import rehypePtpt, { type RehypePtptOptions } from '../src/index'

function process(html: string, options?: RehypePtptOptions): string {
  const file = rehype()
    .data('settings', { fragment: true })
    .use(rehypePtpt, options)
    .processSync(html)
  return String(file)
}

async function until(check: () => boolean, timeout = 1000): Promise<void> {
  const start = Date.now()
  while (!check()) {
    if (Date.now() - start > timeout) throw new Error('until: timed out')
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

describe('rehypePtpt — inline marker', () => {
  it('converts a marked element to hydratable markup', () => {
    const out = process('<p><span class="patapata" data-preset="alpha">HI</span></p>')
    expect(out).toContain('class="ptpt"')
    expect(out).toContain('data-ptpt-targets="HI"')
    expect(out).toContain('data-ptpt-preset="alpha"')
    expect(out).toContain('>HI<') // text stays readable without JS
    expect(out).not.toContain('class="patapata"')
  })

  it('applies defaultPreset when none is specified', () => {
    const out = process('<span class="patapata">7</span>', { defaultPreset: 'digits' })
    expect(out).toContain('data-ptpt-preset="digits"')
  })

  it('leaves unmarked content untouched', () => {
    expect(process('<p>plain</p>')).toBe('<p>plain</p>')
  })
})

describe('rehypePtpt — code fence', () => {
  it('converts each line of a patapata block to a board row', () => {
    const out = process('<pre><code class="language-patapata">AB\nCD</code></pre>')
    expect(out).toContain('class="ptpt-block"')
    expect(out).toContain('data-ptpt-targets="AB"')
    expect(out).toContain('data-ptpt-targets="CD"')
    expect(out).not.toContain('language-patapata')
  })

  it('leaves other code blocks alone', () => {
    const out = process('<pre><code class="language-js">1</code></pre>')
    expect(out).toContain('language-js')
    expect(out).not.toContain('data-ptpt-targets')
  })
})

describe('hydrate', () => {
  it('builds animated cells from static markup', async () => {
    document.body.innerHTML =
      '<span data-ptpt-targets="42" data-ptpt-preset="digits" data-ptpt-duration="2">42</span>'
    const boards = hydrate(document.body)
    expect(boards).toHaveLength(1)

    const container = document.querySelector<HTMLElement>('[data-ptpt-targets]')
    expect(container?.getAttribute('data-ptpt-hydrated')).not.toBeNull()
    expect(container?.querySelectorAll('.ptpt-cell')).toHaveLength(2)
    await until(() => container?.getAttribute('aria-label') === '4 2')
  })

  it('skips already-hydrated containers', () => {
    document.body.innerHTML = '<span data-ptpt-targets="A">A</span>'
    expect(hydrate(document.body)).toHaveLength(1)
    expect(hydrate(document.body)).toHaveLength(0)
  })
})
