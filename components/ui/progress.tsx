"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full transition-all",
  {
    variants: {
      variant: {
        default: "bg-primary/20 dark:bg-primary/10",
        construction: "bg-construction-500/20 dark:bg-construction-500/10",
        success: "bg-green-500/20 dark:bg-green-500/10",
        warning: "bg-amber-500/20 dark:bg-amber-500/10",
        destructive: "bg-red-500/20 dark:bg-red-500/10",
        info: "bg-blue-500/20 dark:bg-blue-500/10",
      },
      size: {
        default: "h-2",
        sm: "h-1",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        construction: "bg-construction-500",
        success: "bg-green-500",
        warning: "bg-amber-500",
        destructive: "bg-red-500",
        info: "bg-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ProgressProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, "value">,
    VariantProps<typeof progressVariants> {
  value?: number
  /** Show animated stripes (useful for indeterminate state) */
  striped?: boolean
  /** Animate the stripes */
  animated?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, striped, animated, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(progressVariants({ variant, size }), className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        indicatorVariants({ variant }),
        striped && "bg-stripes",
        animated && "animate-stripes"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress, progressVariants }
