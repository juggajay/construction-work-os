'use client'

import { useState, useEffect, useRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  /** Fallback image on error */
  fallbackSrc?: string
  /** Show skeleton while loading */
  showSkeleton?: boolean
}

/**
 * Lazy-loaded image component with Intersection Observer
 * Only loads when image enters viewport
 */
export function LazyImage({
  src,
  alt,
  fallbackSrc,
  showSkeleton = true,
  className,
  ...props
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isInView, setIsInView] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // Load 50px before entering viewport
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setError(true)
    setIsLoading(false)
  }

  const imageSrc = error && fallbackSrc ? fallbackSrc : src

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {showSkeleton && isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      {isInView && (
        <Image
          src={imageSrc}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  )
}
