import { describe, expect, it, vi } from 'vitest'
import ptpt from '../src/index'

type SetupHook = NonNullable<ReturnType<typeof ptpt>['hooks']['astro:config:setup']>

/** Invoke the config:setup hook with spies for the bits we use. */
function runSetup(integration: ReturnType<typeof ptpt>) {
  const updateConfig = vi.fn()
  const injectScript = vi.fn()
  const setup = integration.hooks['astro:config:setup'] as SetupHook
  // Only updateConfig / injectScript are exercised; the rest is unused here.
  setup({ updateConfig, injectScript } as unknown as Parameters<SetupHook>[0])
  return { updateConfig, injectScript }
}

describe('ptpt astro integration', () => {
  it('exposes a named config:setup hook', () => {
    const integration = ptpt()
    expect(integration.name).toBe('@love-rox/ptpt-astro')
    expect(typeof integration.hooks['astro:config:setup']).toBe('function')
  })

  it('registers the rehype plugin and injects styles + hydrate by default', () => {
    const { updateConfig, injectScript } = runSetup(ptpt())

    expect(updateConfig).toHaveBeenCalledTimes(1)
    const config = updateConfig.mock.calls[0]?.[0] as {
      markdown: { rehypePlugins: unknown[] }
    }
    expect(config.markdown.rehypePlugins).toHaveLength(1)

    const scripts = injectScript.mock.calls.map((call) => call[1] as string)
    expect(scripts.some((s) => s.includes('styles.css'))).toBe(true)
    expect(scripts.some((s) => s.includes('hydrate'))).toBe(true)
  })

  it('can disable markdown, styles and hydrate', () => {
    const { updateConfig, injectScript } = runSetup(
      ptpt({ markdown: false, styles: false, hydrate: false }),
    )
    expect(updateConfig).not.toHaveBeenCalled()
    expect(injectScript).not.toHaveBeenCalled()
  })

  it('forwards rehype options when markdown is an object', () => {
    const { updateConfig } = runSetup(ptpt({ markdown: { defaultPreset: 'digits' } }))
    const config = updateConfig.mock.calls[0]?.[0] as {
      markdown: { rehypePlugins: unknown[][] }
    }
    const entry = config.markdown.rehypePlugins[0]
    expect(Array.isArray(entry)).toBe(true)
    expect(entry?.[1]).toEqual({ defaultPreset: 'digits' })
  })
})
