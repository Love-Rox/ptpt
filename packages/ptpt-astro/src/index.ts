import rehypePtpt, { type RehypePtptOptions } from '@love-rox/ptpt-rehype'
import type { AstroIntegration } from 'astro'

/** Options for the {@link ptpt} Astro integration. */
export type PtptIntegrationOptions = {
  /**
   * Register the rehype plugin for Markdown/MDX. Pass an object to forward
   * {@link RehypePtptOptions}. Default `true`.
   */
  markdown?: boolean | RehypePtptOptions
  /** Inject `@love-rox/ptpt-core/styles.css` on every page. Default `true`. */
  styles?: boolean
  /** Inject the client hydrator that runs on load. Default `true`. */
  hydrate?: boolean
}

const HYDRATE_SCRIPT = `import { hydrate } from '@love-rox/ptpt-rehype/client'
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => hydrate())
} else {
  hydrate()
}`

/**
 * Astro integration for ptpt split-flap displays.
 *
 * Wires up the rehype plugin for Markdown, injects the default stylesheet, and
 * runs the client hydrator on every page. Pair it with the
 * `Patapata.astro` / `PatapataBoard.astro` components.
 *
 * @example
 * ```ts
 * // astro.config.mjs
 * import ptpt from '@love-rox/ptpt-astro'
 * export default defineConfig({ integrations: [ptpt()] })
 * ```
 */
export default function ptpt(options: PtptIntegrationOptions = {}): AstroIntegration {
  const { markdown = true, styles = true, hydrate = true } = options

  return {
    name: '@love-rox/ptpt-astro',
    hooks: {
      'astro:config:setup': ({ updateConfig, injectScript }) => {
        if (markdown) {
          const rehypeOptions = typeof markdown === 'object' ? markdown : undefined
          updateConfig({
            markdown: {
              rehypePlugins: [rehypeOptions ? [rehypePtpt, rehypeOptions] : rehypePtpt],
            },
          })
        }
        if (styles) {
          injectScript('page', "import '@love-rox/ptpt-core/styles.css'")
        }
        if (hydrate) {
          injectScript('page', HYDRATE_SCRIPT)
        }
      },
    },
  }
}

export { ptpt }
