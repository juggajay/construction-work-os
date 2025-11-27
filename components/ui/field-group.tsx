import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle2, AlertTriangle, Info, HelpCircle } from "lucide-react"

// ============================================
// FIELD GROUP VARIANTS
// ============================================
const fieldGroupVariants = cva(
  "flex flex-col gap-2",
  {
    variants: {
      // ============================================
      // SIZE VARIANTS
      // ============================================
      size: {
        default: "gap-1.5",
        sm: "gap-1",
        lg: "gap-2",
        // Field worker optimized (larger spacing)
        field: "gap-3",
      },

      // ============================================
      // STATE VARIANTS
      // ============================================
      state: {
        default: "",
        error: "",
        success: "",
        warning: "",
        info: "",
      },

      // ============================================
      // REQUIRED INDICATOR
      // ============================================
      required: {
        true: "",
        false: "",
      },
    },

    defaultVariants: {
      size: "default",
      state: "default",
      required: false,
    },
  }
)

// ============================================
// FIELD LABEL
// ============================================
const labelVariants = cva(
  [
    "text-sm font-medium leading-none",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  ].join(" "),
  {
    variants: {
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
        field: "text-base font-semibold",
      },
      state: {
        default: "text-foreground",
        error: "text-danger",
        success: "text-success",
        warning: "text-warning",
        info: "text-info",
      },
    },
    defaultVariants: {
      size: "default",
      state: "default",
    },
  }
)

// ============================================
// FIELD DESCRIPTION/HELP TEXT
// ============================================
const descriptionVariants = cva(
  "text-muted-foreground",
  {
    variants: {
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-sm",
        field: "text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

// ============================================
// FIELD MESSAGE (Error/Success/Warning)
// ============================================
const messageVariants = cva(
  "flex items-center gap-1.5",
  {
    variants: {
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-sm",
        field: "text-base",
      },
      state: {
        default: "text-muted-foreground",
        error: "text-danger",
        success: "text-success",
        warning: "text-warning",
        info: "text-info",
      },
    },
    defaultVariants: {
      size: "default",
      state: "default",
    },
  }
)

// ============================================
// FIELD GROUP PROPS
// ============================================
export interface FieldGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof fieldGroupVariants> {
  /** Field label */
  label?: string
  /** Description/help text shown below label */
  description?: string
  /** Error message */
  error?: string
  /** Success message */
  success?: string
  /** Warning message */
  warning?: string
  /** Info message */
  info?: string
  /** Show required indicator */
  required?: boolean
  /** Optional hint shown inline with label */
  hint?: string
  /** HTML for attribute for label */
  htmlFor?: string
  /** Hide the label visually (for accessibility) */
  hideLabel?: boolean
  /** Counter text (e.g., "0/500") */
  counter?: string
}

// Icon mapping for states
const stateIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({
    className,
    size,
    state: stateProp,
    required,
    label,
    description,
    error,
    success,
    warning,
    info,
    hint,
    htmlFor,
    hideLabel,
    counter,
    children,
    ...props
  }, ref) => {
    // Determine state from props
    const state = error ? "error" : success ? "success" : warning ? "warning" : info ? "info" : stateProp || "default"
    const message = error || success || warning || info

    // Get appropriate icon for state
    const StateIcon = state !== "default" ? stateIcons[state as keyof typeof stateIcons] : null

    return (
      <div
        ref={ref}
        className={cn(fieldGroupVariants({ size, state, required, className }))}
        {...props}
      >
        {/* Label row */}
        {label && (
          <div className={cn("flex items-center justify-between gap-2", hideLabel && "sr-only")}>
            <label
              htmlFor={htmlFor}
              className={cn(labelVariants({ size, state }))}
            >
              {label}
              {required && (
                <span className="ml-0.5 text-danger" aria-hidden="true">*</span>
              )}
            </label>
            {(hint || counter) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                {hint && (
                  <span className={cn(
                    "inline-flex items-center gap-1",
                    size === "field" ? "text-sm" : "text-xs"
                  )}>
                    <HelpCircle className="h-3 w-3" />
                    {hint}
                  </span>
                )}
                {counter && (
                  <span className={cn(
                    "tabular-nums",
                    size === "field" ? "text-sm" : "text-xs"
                  )}>
                    {counter}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className={cn(descriptionVariants({ size }))}>
            {description}
          </p>
        )}

        {/* Field content */}
        <div className="relative">
          {children}
        </div>

        {/* Message (error/success/warning/info) */}
        {message && (
          <div
            className={cn(messageVariants({ size, state }))}
            role={state === "error" ? "alert" : undefined}
            aria-live={state === "error" ? "assertive" : "polite"}
          >
            {StateIcon && <StateIcon className={cn(
              size === "field" ? "h-5 w-5" : "h-4 w-4"
            )} />}
            <span>{message}</span>
          </div>
        )}
      </div>
    )
  }
)
FieldGroup.displayName = "FieldGroup"

// ============================================
// FIELD ROW (Horizontal layout for multiple fields)
// ============================================
export interface FieldRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns (responsive) */
  cols?: 1 | 2 | 3 | 4
  /** Gap between items */
  gap?: "sm" | "default" | "lg"
}

const FieldRow = React.forwardRef<HTMLDivElement, FieldRowProps>(
  ({ className, cols = 2, gap = "default", children, ...props }, ref) => {
    const gapClasses = {
      sm: "gap-3",
      default: "gap-4 md:gap-6",
      lg: "gap-6 md:gap-8",
    }

    const colClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          colClasses[cols],
          gapClasses[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
FieldRow.displayName = "FieldRow"

// ============================================
// FIELD SECTION (Group of related fields)
// ============================================
export interface FieldSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Visual style */
  variant?: "default" | "card" | "bordered"
}

const FieldSection = React.forwardRef<HTMLDivElement, FieldSectionProps>(
  ({ className, title, description, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-4",
          variant === "card" && [
            "p-4 md:p-6 rounded-xl border border-border bg-card",
            "dark:bg-surface-1 dark:border-white/10",
          ],
          variant === "bordered" && [
            "pt-4 border-t border-border",
            "dark:border-white/10",
          ],
          className
        )}
        {...props}
      >
        {(title || description) && (
          <div className="space-y-1">
            {title && (
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    )
  }
)
FieldSection.displayName = "FieldSection"

export { FieldGroup, FieldRow, FieldSection, fieldGroupVariants, labelVariants, descriptionVariants, messageVariants }
