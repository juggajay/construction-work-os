import * as React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Touch-friendly button with larger touch target (min 44x44px per WCAG guidelines)
 * Automatically applies on mobile devices
 */
export interface TouchButtonProps extends ButtonProps {
  /** Force touch-friendly sizing on all devices */
  alwaysTouch?: boolean
}

const TouchButton = React.forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, alwaysTouch = false, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          // Touch-friendly sizing
          alwaysTouch
            ? 'min-h-[44px] min-w-[44px]'
            : 'min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0',
          'touch-manipulation', // Improves touch responsiveness
          className
        )}
        {...props}
      />
    )
  }
)
TouchButton.displayName = 'TouchButton'

export { TouchButton }
