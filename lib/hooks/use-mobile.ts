'use client'

import { useEffect, useState } from 'react'
import { debounce } from '@/lib/utils/debounce'

// Tailwind breakpoints for consistency
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

/**
 * Hook to detect if the device is mobile
 * Breakpoint at 1024px (Tailwind's lg breakpoint)
 * Returns undefined during SSR to prevent hydration mismatches
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    }

    // Check on mount
    checkMobile()

    // Debounced resize listener for better performance
    const debouncedCheck = debounce(checkMobile, 150)
    window.addEventListener('resize', debouncedCheck)
    return () => window.removeEventListener('resize', debouncedCheck)
  }, [])

  return isMobile
}

/**
 * Hook to detect current breakpoint
 * Returns: 'mobile' (< 768px), 'tablet' (768-1023px), 'desktop' (>= 1024px)
 * Returns undefined during SSR to prevent hydration mismatches
 */
export function useBreakpoint(): Breakpoint | undefined {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | undefined>(undefined)

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      if (width < BREAKPOINTS.md) {
        setBreakpoint('mobile')
      } else if (width < BREAKPOINTS.lg) {
        setBreakpoint('tablet')
      } else {
        setBreakpoint('desktop')
      }
    }

    // Check on mount
    checkBreakpoint()

    // Debounced resize listener for better performance
    const debouncedCheck = debounce(checkBreakpoint, 150)
    window.addEventListener('resize', debouncedCheck)
    return () => window.removeEventListener('resize', debouncedCheck)
  }, [])

  return breakpoint
}

/**
 * Hook to detect touch device
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    // Proper type guard for legacy IE
    const nav = navigator as Navigator & { msMaxTouchPoints?: number }

    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (nav.msMaxTouchPoints ?? 0) > 0
    )
  }, [])

  return isTouch
}

/**
 * Hook to get window dimensions
 * Returns undefined during SSR
 */
export function useWindowSize() {
  const [size, setSize] = useState<{ width: number; height: number } | undefined>(undefined)

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateSize()

    const debouncedUpdate = debounce(updateSize, 150)
    window.addEventListener('resize', debouncedUpdate)
    return () => window.removeEventListener('resize', debouncedUpdate)
  }, [])

  return size
}

/**
 * Hook to detect if a media query matches
 * @param query - CSS media query string (e.g., '(min-width: 1024px)')
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const onChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
