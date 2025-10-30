import * as React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * Mobile-optimized card with touch-friendly spacing and interactions
 */
export interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Enable tap highlight effect */
  tappable?: boolean
  /** Use compact spacing on mobile */
  compact?: boolean
}

const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
  ({ className, tappable = false, compact = false, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          // Responsive padding
          compact ? 'p-3 lg:p-4' : 'p-4 lg:p-6',
          // Touch-friendly interactions
          tappable && [
            'cursor-pointer',
            'touch-manipulation',
            'active:scale-[0.98]',
            'transition-transform',
            'hover:shadow-md',
          ],
          className
        )}
        {...props}
      />
    )
  }
)
MobileCard.displayName = 'MobileCard'

export { MobileCard }
