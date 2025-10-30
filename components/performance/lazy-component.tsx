'use client'

import { ReactNode } from 'react'
import { useIntersectionObserver } from '@/lib/hooks/use-intersection-observer'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyComponentProps {
  /** Content to lazy load */
  children: ReactNode
  /** Fallback while not visible */
  fallback?: ReactNode
  /** Root margin for intersection observer */
  rootMargin?: string
  /** Height of skeleton (if no fallback) */
  height?: number
  /** Custom className */
  className?: string
}

/**
 * Lazy-loads component when it enters viewport
 * Reduces initial render time for content below the fold
 */
export function LazyComponent({
  children,
  fallback,
  rootMargin = '100px',
  height = 200,
  className = '',
}: LazyComponentProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin,
    once: true,
  })

  const defaultFallback = <Skeleton className="w-full" height={height} />

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {isIntersecting ? children : fallback || defaultFallback}
    </div>
  )
}
