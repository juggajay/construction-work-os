import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface CardSkeletonProps {
  /** Number of cards to render */
  count?: number
  /** Show header skeleton */
  showHeader?: boolean
  /** Custom className */
  className?: string
}

/**
 * Skeleton loader for card components
 */
export function CardSkeleton({ count = 1, showHeader = true, className }: CardSkeletonProps) {
  const skeletons = Array.from({ length: count })

  return (
    <>
      {skeletons.map((_, i) => (
        <Card key={i} className={cn('card-hover', className)}>
          {showHeader && (
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          )}
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </CardContent>
        </Card>
      ))}
    </>
  )
}

/**
 * Skeleton loader for KPI cards
 */
export function KPICardSkeleton({ count = 4 }: { count?: number }) {
  const skeletons = Array.from({ length: count })

  return (
    <>
      {skeletons.map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </Card>
      ))}
    </>
  )
}

/**
 * Skeleton loader for project cards
 */
export function ProjectCardSkeleton({ count = 3 }: { count?: number }) {
  const skeletons = Array.from({ length: count })

  return (
    <>
      {skeletons.map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton circle={true} width={32} height={32} />
            <Skeleton circle={true} width={32} height={32} />
            <Skeleton circle={true} width={32} height={32} />
          </div>
        </Card>
      ))}
    </>
  )
}

/**
 * Skeleton loader for table rows
 */
export function TableRowSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const rowArray = Array.from({ length: rows })
  const columnArray = Array.from({ length: columns })

  return (
    <>
      {rowArray.map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b">
          {columnArray.map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
