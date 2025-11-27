import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  // Base styles - Apple/Stripe inspired with field worker optimizations
  [
    "flex w-full rounded-lg border bg-background",
    "px-3 shadow-sm",
    "transition-all duration-fast ease-out",
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
    "focus-visible:border-ring",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Dark mode
    "dark:bg-surface-1 dark:border-white/10",
    "dark:focus-visible:ring-construction/30 dark:focus-visible:border-construction/50",
  ].join(" "),
  {
    variants: {
      // ============================================
      // SIZE VARIANTS
      // ============================================
      inputSize: {
        xs: "h-7 px-2 py-1 text-xs rounded-md",
        sm: "h-8 px-2.5 py-1.5 text-sm rounded-md",
        default: "h-10 py-2 text-base md:text-sm",
        lg: "h-11 px-4 py-2.5 text-base",
        xl: "h-12 px-4 py-3 text-base",

        // ============================================
        // FIELD WORKER SIZES (56px+ for glove use)
        // ============================================
        field: [
          "h-14 min-h-touch-xl px-5 py-4",
          "text-base font-medium rounded-xl",
        ].join(" "),

        "field-lg": [
          "h-16 min-h-touch-2xl px-6 py-5",
          "text-lg font-medium rounded-xl",
        ].join(" "),

        // Touch-optimized (48px)
        touch: "h-12 px-4 py-3 text-base min-h-touch-lg rounded-lg",
      },

      // ============================================
      // STATE VARIANTS
      // ============================================
      state: {
        default: "",
        filled: "bg-surface-1 border-transparent dark:bg-surface-2",
        error: [
          "border-danger text-danger",
          "ring-2 ring-danger/20",
          "placeholder:text-danger/50",
          "focus-visible:ring-danger/30 focus-visible:border-danger",
        ].join(" "),
        success: [
          "border-success text-foreground",
          "ring-2 ring-success/20",
          "focus-visible:ring-success/30 focus-visible:border-success",
        ].join(" "),
        warning: [
          "border-warning text-foreground",
          "ring-2 ring-warning/20",
          "focus-visible:ring-warning/30 focus-visible:border-warning",
        ].join(" "),
      },

      // ============================================
      // ICON HANDLING
      // ============================================
      withIcon: {
        none: "",
        left: "pl-10",
        right: "pr-10",
        both: "pl-10 pr-10",
      },

      // ============================================
      // ADDITIONAL VARIANTS
      // ============================================
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },

    defaultVariants: {
      inputSize: "default",
      state: "default",
      withIcon: "none",
      fullWidth: true,
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  /** @deprecated Use state="error" instead */
  error?: boolean
  /** @deprecated Use inputSize instead */
  touchOptimized?: boolean
  /** Left icon element */
  leftIcon?: React.ReactNode
  /** Right icon element */
  rightIcon?: React.ReactNode
  /** Container className */
  containerClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    containerClassName,
    type,
    inputSize,
    state,
    withIcon,
    fullWidth,
    error,
    touchOptimized,
    leftIcon,
    rightIcon,
    ...props
  }, ref) => {
    // Handle legacy props
    const resolvedSize = touchOptimized ? "touch" : inputSize
    const resolvedState = error ? "error" : state

    // Determine icon variant
    const iconVariant = leftIcon && rightIcon
      ? "both"
      : leftIcon
        ? "left"
        : rightIcon
          ? "right"
          : withIcon

    // If no icons, render simple input
    if (!leftIcon && !rightIcon) {
      return (
        <input
          type={type}
          className={cn(inputVariants({
            inputSize: resolvedSize,
            state: resolvedState,
            withIcon: iconVariant,
            fullWidth,
            className
          }))}
          ref={ref}
          aria-invalid={resolvedState === "error" ? "true" : undefined}
          {...props}
        />
      )
    }

    // With icons, wrap in container
    return (
      <div className={cn("relative", fullWidth && "w-full", containerClassName)}>
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(inputVariants({
            inputSize: resolvedSize,
            state: resolvedState,
            withIcon: iconVariant,
            fullWidth,
            className
          }))}
          ref={ref}
          aria-invalid={resolvedState === "error" ? "true" : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

// ============================================
// SEARCH INPUT COMPONENT
// ============================================
import { Search, X } from "lucide-react"

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  /** Callback when clear button is clicked */
  onClear?: () => void
  /** Show clear button when there's a value */
  showClear?: boolean
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, showClear = true, value, className, ...props }, ref) => {
    const hasValue = Boolean(value && String(value).length > 0)

    return (
      <div className="relative w-full">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            inputVariants({ inputSize: "default", withIcon: hasValue && showClear ? "both" : "left" }),
            "[&::-webkit-search-cancel-button]:hidden",
            className
          )}
          {...props}
        />
        {hasValue && showClear && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { Input, SearchInput, inputVariants }
