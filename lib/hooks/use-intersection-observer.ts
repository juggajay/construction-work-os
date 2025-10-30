'use client'

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverProps {
  /** Margin around root (e.g., '50px') */
  rootMargin?: string
  /** Threshold (0-1) for triggering callback */
  threshold?: number | number[]
  /** Root element (defaults to viewport) */
  root?: Element | null
  /** Disconnect after first intersection */
  once?: boolean
}

/**
 * Hook to detect when an element enters the viewport
 * Useful for lazy loading, infinite scroll, animations
 */
export function useIntersectionObserver({
  rootMargin = '0px',
  threshold = 0,
  root = null,
  once = true,
}: UseIntersectionObserverProps = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const elementRef = useRef<Element | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const element = elementRef.current

    if (!element) return

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return

        setEntry(entry)
        setIsIntersecting(entry.isIntersecting)

        if (entry.isIntersecting && once && observerRef.current) {
          observerRef.current.disconnect()
        }
      },
      {
        root,
        rootMargin,
        threshold,
      }
    )

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [root, rootMargin, threshold, once])

  return {
    ref: elementRef,
    entry,
    isIntersecting,
  }
}
