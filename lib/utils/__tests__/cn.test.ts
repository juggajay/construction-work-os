import { describe, it, expect } from 'vitest'
import { cn } from '../index'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'conditional', false && 'excluded')).toBe('base conditional')
  })

  it('handles tailwind conflicts (last one wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'valid')).toBe('base valid')
  })
})
