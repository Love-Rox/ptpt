import { describe, expect, it } from 'vitest'
import { element, frameText, image, text } from '../src/frame'

describe('text', () => {
  it('uses value as slug when slug is omitted', () => {
    expect(text('A')).toEqual({ slug: 'A', type: 'text', value: 'A' })
  })

  it('uses an explicit slug when both args are given', () => {
    expect(text('a-red', 'A')).toEqual({ slug: 'a-red', type: 'text', value: 'A' })
  })

  it('allows different slugs for the same rendered value', () => {
    expect(text('a-red', 'A').value).toBe(text('a-blue', 'A').value)
    expect(text('a-red', 'A').slug).not.toBe(text('a-blue', 'A').slug)
  })
})

describe('image', () => {
  it('creates a minimal image frame', () => {
    expect(image('sun', '/sun.png')).toEqual({ slug: 'sun', type: 'image', src: '/sun.png' })
  })

  it('includes provided options', () => {
    expect(image('sun', '/sun.png', { alt: '太陽', width: 80, height: 80 })).toEqual({
      slug: 'sun',
      type: 'image',
      src: '/sun.png',
      alt: '太陽',
      width: 80,
      height: 80,
    })
  })

  it('omits keys for undefined options (exactOptionalPropertyTypes)', () => {
    const frame = image('sun', '/sun.png', {})
    expect('alt' in frame).toBe(false)
    expect('width' in frame).toBe(false)
    expect('height' in frame).toBe(false)
  })
})

describe('element', () => {
  it('stores the node verbatim', () => {
    const node = document.createElement('div')
    expect(element('e', node)).toEqual({ slug: 'e', type: 'element', node })
  })
})

describe('frameText', () => {
  it('returns value for text frames', () => {
    expect(frameText(text('a', 'A'))).toBe('A')
  })

  it('returns alt for image frames', () => {
    expect(frameText(image('sun', '/sun.png', { alt: '太陽' }))).toBe('太陽')
  })

  it('falls back to slug when an image has no alt', () => {
    expect(frameText(image('sun', '/sun.png'))).toBe('sun')
  })

  it('returns the aria-label for element frames', () => {
    const node = document.createElement('div')
    node.setAttribute('aria-label', 'hello')
    expect(frameText(element('e', node))).toBe('hello')
  })

  it('falls back to empty string when an element has no aria-label', () => {
    expect(frameText(element('e', document.createElement('div')))).toBe('')
  })
})
