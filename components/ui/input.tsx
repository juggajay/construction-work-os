import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  // Base styles - note: text-base on mobile prevents iOS zoom on focus
  "flex w-full rounded-md border border-input bg-transparent px-3 shadow-sm transition-all duration-fast ease-smooth file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[hsl(var(--depth-1))] dark:border-white/10 dark:focus-visible:ring-construction-500/50",
  {
    variants: {
      /** Size variant */
      inputSize: {
        default: "h-10 py-2 text-base md:text-sm",
        sm: "h-8 px-2 py-1 text-sm",
        lg: "h-11 px-4 py-2.5 text-base",
        // Touch-optimized for field workers (larger targets, no iOS zoom)
        touch: "h-12 px-4 py-3 text-base min-h-touch",
        "touch-lg": "h-14 px-5 py-4 text-lg min-h-touch-lg",
      },
      /** Error state styling */
      error: {
        true: "border-destructive focus-visible:ring-destructive/50 dark:border-red-500/50",
        false: "",
      },
    },
    defaultVariants: {
      inputSize: "default",
      error: false,
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  /** @deprecated Use inputSize instead */
  touchOptimized?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, error, touchOptimized, ...props }, ref) => {
    // Handle legacy touchOptimized prop
    const resolvedSize = touchOptimized ? "touch" : inputSize

    return (
      <input
        type={type}
        className={cn(inputVariants({ inputSize: resolvedSize, error, className }))}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
