import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom width */
  width?: string | number
  /** Custom height */
  height?: string | number
  /** Circular skeleton */
  circle?: boolean
}

function Skeleton({
  className,
  width,
  height,
  circle = false,
  ...props
}: SkeletonProps) {
  const styles = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-neutral-200 dark:bg-neutral-800",
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      style={styles}
      {...props}
    />
  )
}

export { Skeleton }
