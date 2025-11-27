import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-fast ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
        // New construction-themed variants
        construction:
          "bg-construction-500 text-white shadow-sm hover:bg-construction-600 dark:bg-construction-500 dark:hover:bg-construction-400",
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90",
        warning:
          "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90",
        // Soft variants for less prominent actions
        "outline-construction":
          "border-2 border-construction-500 text-construction-600 bg-transparent hover:bg-construction-50 dark:text-construction-400 dark:hover:bg-construction-500/10",
        "ghost-construction":
          "text-construction-600 hover:bg-construction-50 dark:text-construction-400 dark:hover:bg-construction-500/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        // Touch-optimized sizes for mobile/field workers (WCAG 44px+ targets)
        touch: "h-12 min-w-touch px-5 py-3 text-base",
        "touch-lg": "h-14 min-w-touch-lg px-6 py-4 text-base font-semibold",
        "touch-icon": "h-12 w-12 min-w-touch min-h-touch",
        "touch-icon-lg": "h-14 w-14 min-w-touch-lg min-h-touch-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Show loading spinner and disable button */
  loading?: boolean
  /** Text to show while loading (defaults to children) */
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading = false,
    loadingText,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"

    // When loading, show spinner and optionally different text
    const content = loading ? (
      <>
        <Loader2 className="animate-spin" />
        {loadingText ?? children}
      </>
    ) : (
      children
    )

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
