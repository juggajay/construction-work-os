'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function PullToRefresh({ onRefresh, children, className, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const PULL_THRESHOLD = 80
  const MAX_PULL = 120

  useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pull if at top of page
      if (window.scrollY === 0 && !isRefreshing && e.touches[0]) {
        startY.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing || !e.touches[0]) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY.current

      // Only allow pulling down
      if (distance > 0) {
        // Prevent default scroll when pulling
        if (distance > 10) {
          e.preventDefault()
        }
        // Apply resistance to pull
        const adjustedDistance = Math.min(distance * 0.5, MAX_PULL)
        setPullDistance(adjustedDistance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return

      setIsPulling(false)

      if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(PULL_THRESHOLD)

        // Add haptic feedback if supported
        if (window.navigator.vibrate) {
          window.navigator.vibrate(10)
        }

        try {
          await onRefresh()
        } catch (error) {
          console.error('Pull to refresh failed:', error)
          // Error will be handled by the parent component
          // Could show a toast notification here
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh, disabled])

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1)
  const showIndicator = pullDistance > 0 || isRefreshing

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 pointer-events-none z-50',
          showIndicator ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${pullDistance}px`,
        }}
      >
        <div className="flex flex-col items-center gap-1 py-2">
          {isRefreshing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-construction-500" />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Refreshing...
              </span>
            </>
          ) : (
            <>
              <div
                className="h-5 w-5 rounded-full border-2 border-neutral-300 dark:border-neutral-700 flex items-center justify-center transition-transform"
                style={{
                  transform: `rotate(${pullProgress * 360}deg)`,
                  borderTopColor: pullProgress >= 1 ? '#FF6B35' : undefined,
                }}
              >
                <div className="h-2 w-2 rounded-full bg-construction-500" style={{ opacity: pullProgress }} />
              </div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
