import type { Element, ElementContent, Root } from 'hast'
import { h } from 'hastscript'
import { SKIP, visit } from 'unist-util-visit'

/** Options for {@link rehypePtpt}. */
export type RehypePtptOptions = {
  /** Class that marks an inline element for conversion. Default `'patapata'`. */
  className?: string
  /** Code-fence language that marks a block for conversion. Default `'patapata'`. */
  fenceLanguage?: string
  /** Preset name applied when an element/block specifies none. */
  defaultPreset?: string
}

/**
 * rehype plugin that turns marked Markdown/HTML into static, hydratable
 * split-flap markup.
 *
 * Two input forms are recognized:
 * - inline elements carrying the marker class, e.g.
 *   `<span class="patapata" data-preset="alpha">HELLO</span>`
 * - fenced code blocks tagged with the fence language, e.g. ` ```patapata `
 *   (one board row per line).
 *
 * Each becomes an element with `data-ptpt-targets` (plus optional
 * `data-ptpt-preset` / `-duration` / `-direction`) whose text content stays
 * readable without JS. Hydrate it on the client with `hydrate` from
 * `@love-rox/ptpt-rehype/client`.
 */
export default function rehypePtpt(options: RehypePtptOptions = {}) {
  const className = options.className ?? 'patapata'
  const langClass = `language-${options.fenceLanguage ?? 'patapata'}`
  const defaultPreset = options.defaultPreset

  return (tree: Root): void => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index === undefined) return

      // Block form: <pre><code class="language-patapata">…</code></pre>
      if (node.tagName === 'pre') {
        const code = node.children.find(
          (child): child is Element => child.type === 'element' && child.tagName === 'code',
        )
        if (code && hasClass(code, langClass)) {
          parent.children[index] = buildBlock(toText(code), defaultPreset)
          return SKIP
        }
        return
      }

      // Inline form: <span class="patapata">…</span>
      if (hasClass(node, className)) {
        parent.children[index] = buildInline(node, defaultPreset)
        return SKIP
      }
    })
  }
}

export { rehypePtpt }

function hasClass(node: Element, name: string): boolean {
  const value = node.properties?.className
  if (Array.isArray(value)) return value.includes(name)
  if (typeof value === 'string') return value.split(/\s+/).includes(name)
  return false
}

function toText(node: ElementContent): string {
  if (node.type === 'text') return node.value
  if (node.type === 'element') return node.children.map(toText).join('')
  return ''
}

function readData(node: Element, key: string): string | undefined {
  const value = node.properties?.[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return undefined
}

type CellMeta = {
  preset?: string | undefined
  duration?: string | undefined
  direction?: string | undefined
}

function cellProperties(text: string, meta: CellMeta): Record<string, string> {
  const properties: Record<string, string> = { className: 'ptpt', 'data-ptpt-targets': text }
  if (meta.preset) properties['data-ptpt-preset'] = meta.preset
  if (meta.duration) properties['data-ptpt-duration'] = meta.duration
  if (meta.direction) properties['data-ptpt-direction'] = meta.direction
  return properties
}

function buildInline(node: Element, defaultPreset: string | undefined): Element {
  const text = toText(node)
  return h(
    'span',
    cellProperties(text, {
      preset: readData(node, 'dataPreset') ?? defaultPreset,
      duration: readData(node, 'dataDuration'),
      direction: readData(node, 'dataDirection'),
    }),
    [text],
  )
}

function buildBlock(text: string, defaultPreset: string | undefined): Element {
  const lines = text.replace(/\n+$/, '').split('\n')
  return h(
    'div',
    { className: 'ptpt-block' },
    lines.map((line) => h('div', cellProperties(line, { preset: defaultPreset }), [line])),
  )
}
