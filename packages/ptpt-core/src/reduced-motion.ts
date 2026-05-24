/**
 * Whether the user has asked the OS to reduce motion
 * (`prefers-reduced-motion: reduce`). Safe to call in non-DOM environments.
 */
export function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}
