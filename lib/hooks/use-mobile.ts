'use client'

import { useEffect, useState } from 'react'
import { debounce } from '@/lib/utils/debounce'

/**
 * Hook to detect if the device is mobile
 * Breakpoint at 1024px (Tailwind's lg breakpoint)
 * Returns undefined during SSR to prevent hydration mismatches
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
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
