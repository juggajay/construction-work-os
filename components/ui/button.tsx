import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - Apple/Stripe inspired with field worker optimizations
  [
    "inline-flex items-center justify-center gap-2.5 whitespace-nowrap",
    "rounded-lg text-sm font-medium",
    "transition-all duration-fast ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "touch-manipulation select-none",
    // Press feedback animation
    "active:scale-[0.97] active:transition-transform active:duration-instant",
  ].join(" "),
  {
    variants: {
      variant: {
        // ============================================
        // PRIMARY VARIANTS
        // ============================================
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",

        // Construction brand - hero buttons
        construction: [
          "bg-gradient-construction text-white shadow-construction",
          "hover:shadow-construction-lg hover:brightness-105",
          "dark:shadow-glow-construction-sm dark:hover:shadow-glow-construction",
        ].join(" "),

        // Construction solid (non-gradient)
        "construction-solid": [
          "bg-construction-500 text-white shadow-sm",
          "hover:bg-construction-600 hover:shadow-md",
          "dark:bg-construction-500 dark:hover:bg-construction-400",
        ].join(" "),

        // ============================================
        // SEMANTIC VARIANTS
        // ============================================
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-danger",

        success: [
          "bg-success text-success-foreground shadow-sm",
          "hover:bg-success/90 hover:shadow-success",
        ].join(" "),

        warning: [
          "bg-warning text-warning-foreground shadow-sm",
          "hover:bg-warning/90 hover:shadow-warning",
        ].join(" "),

        info: [
          "bg-info text-info-foreground shadow-sm",
          "hover:bg-info/90 hover:shadow-info",
        ].join(" "),

        // ============================================
        // SECONDARY VARIANTS
        // ============================================
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",

        outline: [
          "border border-input bg-background shadow-sm",
          "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
        ].join(" "),

        ghost:
          "hover:bg-accent hover:text-accent-foreground",

        link:
          "text-primary underline-offset-4 hover:underline active:scale-100",

        // ============================================
        // CONSTRUCTION OUTLINE/GHOST VARIANTS
        // ============================================
        "outline-construction": [
          "border-2 border-construction-500 text-construction-600 bg-transparent",
          "hover:bg-construction-50 hover:border-construction-600",
          "dark:text-construction-400 dark:hover:bg-construction-500/10 dark:hover:border-construction-400",
        ].join(" "),

        "ghost-construction": [
          "text-construction-600 bg-transparent",
          "hover:bg-construction-50 hover:text-construction-700",
          "dark:text-construction-400 dark:hover:bg-construction-500/10 dark:hover:text-construction-300",
        ].join(" "),

        // ============================================
        // SOFT VARIANTS (Muted backgrounds)
        // ============================================
        "soft-construction": [
          "bg-construction-50 text-construction-700",
          "hover:bg-construction-100 hover:text-construction-800",
          "dark:bg-construction-500/10 dark:text-construction-400 dark:hover:bg-construction-500/20",
        ].join(" "),

        "soft-success": [
          "bg-success-muted text-success",
          "hover:bg-success-muted/80",
          "dark:bg-success/10 dark:hover:bg-success/20",
        ].join(" "),

        "soft-warning": [
          "bg-warning-muted text-warning",
          "hover:bg-warning-muted/80",
          "dark:bg-warning/10 dark:hover:bg-warning/20",
        ].join(" "),

        "soft-danger": [
          "bg-danger-muted text-danger",
          "hover:bg-danger-muted/80",
          "dark:bg-danger/10 dark:hover:bg-danger/20",
        ].join(" "),

        "soft-info": [
          "bg-info-muted text-info",
          "hover:bg-info-muted/80",
          "dark:bg-info/10 dark:hover:bg-info/20",
        ].join(" "),

        // ============================================
        // GLASS VARIANT (For overlays)
        // ============================================
        glass: [
          "bg-white/70 backdrop-blur-glass border border-white/30 text-foreground shadow-glass",
          "hover:bg-white/80 hover:shadow-glass-lg",
          "dark:bg-black/40 dark:border-white/10 dark:text-white dark:hover:bg-black/50",
        ].join(" "),

        // ============================================
        // PREMIUM VARIANTS
        // ============================================
        premium: [
          "bg-gradient-to-r from-sand-900 to-sand-800 text-white shadow-lg",
          "hover:from-sand-800 hover:to-sand-700 hover:shadow-xl",
          "dark:from-sand-100 dark:to-sand-200 dark:text-sand-900",
        ].join(" "),
      },

      size: {
        // ============================================
        // STANDARD SIZES
        // ============================================
        xs: "h-7 px-2.5 text-xs rounded-md gap-1.5 [&_svg]:size-3",
        sm: "h-8 px-3 text-xs rounded-md gap-1.5 [&_svg]:size-3.5",
        default: "h-10 px-4 py-2 gap-2 [&_svg]:size-4",
        lg: "h-11 px-6 text-base gap-2.5 [&_svg]:size-4",
        xl: "h-12 px-8 text-base font-semibold gap-3 [&_svg]:size-5",

        // Icon only
        icon: "h-10 w-10 p-0 [&_svg]:size-5",
        "icon-sm": "h-8 w-8 p-0 [&_svg]:size-4",
        "icon-lg": "h-12 w-12 p-0 [&_svg]:size-5",
        "icon-xl": "h-14 w-14 p-0 [&_svg]:size-6",

        // ============================================
        // FIELD WORKER SIZES (56px+ for glove use)
        // ============================================
        field: [
          "h-14 min-h-touch-xl min-w-touch-xl px-6 py-4",
          "text-base font-semibold rounded-xl gap-3",
          "[&_svg]:size-5",
        ].join(" "),

        "field-lg": [
          "h-16 min-h-touch-2xl min-w-touch-2xl px-8 py-5",
          "text-lg font-semibold rounded-xl gap-3",
          "[&_svg]:size-6",
        ].join(" "),

        "field-icon": [
          "h-14 w-14 min-h-touch-xl min-w-touch-xl p-0 rounded-xl",
          "[&_svg]:size-6",
        ].join(" "),

        "field-icon-lg": [
          "h-16 w-16 min-h-touch-2xl min-w-touch-2xl p-0 rounded-xl",
          "[&_svg]:size-7",
        ].join(" "),

        // Full width field button
        "field-full": [
          "h-14 min-h-touch-xl w-full px-6 py-4",
          "text-base font-semibold rounded-xl gap-3",
          "[&_svg]:size-5",
        ].join(" "),

        // ============================================
        // TOUCH SIZES (48px standard mobile)
        // ============================================
        touch: "h-12 min-h-touch-lg min-w-touch-lg px-5 py-3 text-base gap-2.5 [&_svg]:size-5",
        "touch-icon": "h-12 w-12 min-h-touch-lg min-w-touch-lg p-0 [&_svg]:size-5",
      },

      // ============================================
      // ADDITIONAL VARIANTS
      // ============================================
      fullWidth: {
        true: "w-full",
        false: "",
      },

      rounded: {
        default: "",
        full: "rounded-full",
        none: "rounded-none",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
      rounded: "default",
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
  /** Left icon */
  leftIcon?: React.ReactNode
  /** Right icon */
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    rounded,
    asChild = false,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"

    // Determine spinner size based on button size
    const spinnerSize = size?.toString().includes('field') || size?.toString().includes('xl')
      ? "h-5 w-5"
      : size === 'sm' || size === 'xs'
        ? "h-3.5 w-3.5"
        : "h-4 w-4"

    // Build content with optional icons
    const content = loading ? (
      <>
        <Loader2 className={cn("animate-spin", spinnerSize)} />
        <span>{loadingText ?? children}</span>
      </>
    ) : (
      <>
        {leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </>
    )

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, rounded, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

// ============================================
// ICON BUTTON COMPONENT
// ============================================
export interface IconButtonProps
  extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'loadingText'> {
  /** Accessible label for screen readers */
  'aria-label': string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = "icon", children, ...props }, ref) => {
    return (
      <Button ref={ref} size={size} {...props}>
        {children}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

export { Button, IconButton, buttonVariants }
