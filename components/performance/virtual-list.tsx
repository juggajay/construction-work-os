'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'

interface VirtualListProps<T> {
  /** Array of items to render */
  items: T[]
  /** Height of each item in pixels */
  itemHeight: number
  /** Container height in pixels */
  containerHeight: number
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode
  /** Number of items to render outside viewport (buffer) */
  overscan?: number
  /** Custom className for container */
  className?: string
}

/**
 * Virtual scrolling list component
 * Only renders visible items for better performance with large lists
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1)

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                overflow: 'hidden',
              }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
