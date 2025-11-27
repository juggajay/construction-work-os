import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Check, Circle } from "lucide-react"

// ============================================
// QUICK SELECT CONTAINER VARIANTS
// ============================================
const quickSelectVariants = cva(
  "grid gap-2",
  {
    variants: {
      // ============================================
      // LAYOUT
      // ============================================
      layout: {
        horizontal: "grid-flow-col auto-cols-fr",
        vertical: "grid-cols-1",
        grid: "grid-cols-2",
        "grid-3": "grid-cols-3",
        "grid-4": "grid-cols-4",
        responsive: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
      },

      // ============================================
      // SIZE
      // ============================================
      size: {
        sm: "gap-1.5",
        default: "gap-2",
        lg: "gap-3",
        field: "gap-3",
      },
    },

    defaultVariants: {
      layout: "horizontal",
      size: "default",
    },
  }
)

// ============================================
// QUICK SELECT OPTION VARIANTS
// ============================================
const quickSelectOptionVariants = cva(
  [
    "relative flex items-center justify-center gap-2",
    "rounded-lg border font-medium cursor-pointer",
    "transition-all duration-fast ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "touch-manipulation select-none",
    // Active press state
    "active:scale-[0.97] active:transition-transform active:duration-instant",
  ].join(" "),
  {
    variants: {
      // ============================================
      // SIZE
      // ============================================
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        // Field worker optimized (56px+)
        field: "h-14 min-h-touch-xl px-5 text-base font-semibold rounded-xl",
        "field-lg": "h-16 min-h-touch-2xl px-6 text-lg font-semibold rounded-xl",
      },

      // ============================================
      // VARIANT
      // ============================================
      variant: {
        default: [
          "border-border bg-background text-foreground",
          "hover:border-construction/30 hover:bg-construction-50/50",
          "dark:bg-surface-1 dark:border-white/10",
          "dark:hover:border-construction/30 dark:hover:bg-construction-500/10",
        ].join(" "),

        outline: [
          "border-border bg-transparent text-foreground",
          "hover:border-construction hover:text-construction",
          "dark:border-white/20 dark:hover:border-construction",
        ].join(" "),

        soft: [
          "border-transparent bg-muted text-muted-foreground",
          "hover:bg-construction-50 hover:text-construction-700",
          "dark:bg-surface-2 dark:hover:bg-construction-500/10 dark:hover:text-construction-400",
        ].join(" "),

        card: [
          "border-border bg-card text-card-foreground shadow-sm flex-col py-3",
          "hover:shadow-md hover:border-construction/30",
          "dark:bg-surface-1 dark:border-white/10",
          "dark:hover:border-construction/30 dark:hover:shadow-glow-construction-sm",
        ].join(" "),
      },

      // ============================================
      // SELECTED STATE
      // ============================================
      selected: {
        true: "",
        false: "",
      },

      // ============================================
      // FULL WIDTH
      // ============================================
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },

    compoundVariants: [
      // Selected states per variant
      {
        variant: "default",
        selected: true,
        className: [
          "border-construction bg-construction-50 text-construction-700",
          "dark:bg-construction-500/20 dark:border-construction dark:text-construction-400",
          "ring-2 ring-construction/20",
        ].join(" "),
      },
      {
        variant: "outline",
        selected: true,
        className: [
          "border-construction bg-construction-50/50 text-construction-700",
          "dark:bg-construction-500/10 dark:border-construction dark:text-construction-400",
        ].join(" "),
      },
      {
        variant: "soft",
        selected: true,
        className: [
          "bg-construction-100 text-construction-700",
          "dark:bg-construction-500/20 dark:text-construction-400",
        ].join(" "),
      },
      {
        variant: "card",
        selected: true,
        className: [
          "border-construction shadow-construction/10 bg-construction-50",
          "dark:bg-construction-500/10 dark:border-construction dark:shadow-glow-construction-sm",
        ].join(" "),
      },
    ],

    defaultVariants: {
      size: "default",
      variant: "default",
      selected: false,
      fullWidth: false,
    },
  }
)

// ============================================
// TYPES
// ============================================
export interface QuickSelectOption<T = string> {
  value: T
  label: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface QuickSelectProps<T = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof quickSelectVariants> {
  /** Options to display */
  options: QuickSelectOption<T>[]
  /** Current selected value */
  value?: T
  /** Multiple selection mode */
  multiple?: boolean
  /** Selected values for multiple mode */
  values?: T[]
  /** Callback when selection changes */
  onChange?: (value: T) => void
  /** Callback for multiple selection */
  onMultiChange?: (values: T[]) => void
  /** Option variant */
  optionVariant?: VariantProps<typeof quickSelectOptionVariants>['variant']
  /** Option size */
  optionSize?: VariantProps<typeof quickSelectOptionVariants>['size']
  /** Show check icon when selected */
  showCheck?: boolean
  /** Name for form submission */
  name?: string
  /** Disabled state */
  disabled?: boolean
}

// ============================================
// QUICK SELECT COMPONENT
// ============================================
function QuickSelect<T extends string | number = string>({
  className,
  layout,
  size,
  options,
  value,
  multiple = false,
  values = [],
  onChange,
  onMultiChange,
  optionVariant = "default",
  optionSize,
  showCheck = true,
  name,
  disabled = false,
  ...props
}: QuickSelectProps<T>) {
  const resolvedSize = optionSize || (size === "field" ? "field" : "default")

  const handleSelect = (optionValue: T) => {
    if (disabled) return

    if (multiple) {
      const newValues = values.includes(optionValue)
        ? values.filter(v => v !== optionValue)
        : [...values, optionValue]
      onMultiChange?.(newValues)
    } else {
      onChange?.(optionValue)
    }
  }

  const isSelected = (optionValue: T) => {
    if (multiple) {
      return values.includes(optionValue)
    }
    return value === optionValue
  }

  return (
    <div
      role={multiple ? "group" : "radiogroup"}
      aria-label={name}
      className={cn(quickSelectVariants({ layout, size, className }))}
      {...props}
    >
      {options.map((option) => {
        const selected = isSelected(option.value)
        const isDisabled = disabled || option.disabled

        return (
          <button
            key={String(option.value)}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            onClick={() => handleSelect(option.value)}
            className={cn(
              quickSelectOptionVariants({
                size: resolvedSize,
                variant: optionVariant,
                selected,
                fullWidth: layout === "vertical",
              })
            )}
          >
            {/* Check indicator */}
            {showCheck && selected && (
              <span className="absolute top-1.5 right-1.5 text-construction dark:text-construction-400">
                <Check className={cn(
                  resolvedSize === "field" || resolvedSize === "field-lg" ? "h-5 w-5" : "h-4 w-4"
                )} />
              </span>
            )}

            {/* Icon */}
            {option.icon && (
              <span className={cn(
                "shrink-0",
                optionVariant === "card" && "mb-1"
              )}>
                {option.icon}
              </span>
            )}

            {/* Content */}
            <span className={cn(
              optionVariant === "card" && "text-center"
            )}>
              <span className="block">{option.label}</span>
              {option.description && (
                <span className={cn(
                  "block text-muted-foreground font-normal",
                  resolvedSize === "field" || resolvedSize === "field-lg" ? "text-sm" : "text-xs"
                )}>
                  {option.description}
                </span>
              )}
            </span>

            {/* Hidden input for form submission */}
            {name && selected && (
              <input type="hidden" name={name} value={String(option.value)} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ============================================
// QUICK SELECT ITEM (Standalone option)
// ============================================
export interface QuickSelectItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>,
    VariantProps<typeof quickSelectOptionVariants> {
  /** Whether the item is selected */
  selected?: boolean
  /** Icon to display */
  icon?: React.ReactNode
  /** Description text */
  description?: string
  /** Show check indicator */
  showCheck?: boolean
}

const QuickSelectItem = React.forwardRef<HTMLButtonElement, QuickSelectItemProps>(
  ({
    className,
    size,
    variant,
    selected,
    fullWidth,
    icon,
    description,
    showCheck = true,
    children,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          quickSelectOptionVariants({ size, variant, selected, fullWidth, className })
        )}
        aria-pressed={selected}
        {...props}
      >
        {showCheck && selected && (
          <span className="absolute top-1.5 right-1.5 text-construction dark:text-construction-400">
            <Check className={cn(
              size === "field" || size === "field-lg" ? "h-5 w-5" : "h-4 w-4"
            )} />
          </span>
        )}
        {icon && <span className="shrink-0">{icon}</span>}
        <span>
          <span className="block">{children}</span>
          {description && (
            <span className={cn(
              "block text-muted-foreground font-normal",
              size === "field" || size === "field-lg" ? "text-sm" : "text-xs"
            )}>
              {description}
            </span>
          )}
        </span>
      </button>
    )
  }
)
QuickSelectItem.displayName = "QuickSelectItem"

// ============================================
// STATUS QUICK SELECT (Predefined status options)
// ============================================
export interface StatusQuickSelectProps extends Omit<QuickSelectProps<string>, 'options'> {
  /** Predefined status type */
  statusType: 'project' | 'task' | 'rfi' | 'submittal' | 'changeOrder'
  /** Custom status options (override predefined) */
  customStatuses?: QuickSelectOption<string>[]
}

const statusOptions: Record<string, QuickSelectOption<string>[]> = {
  project: [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
  ],
  task: [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
  ],
  rfi: [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'answered', label: 'Answered' },
    { value: 'closed', label: 'Closed' },
  ],
  submittal: [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ],
  changeOrder: [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ],
}

function StatusQuickSelect({
  statusType,
  customStatuses,
  ...props
}: StatusQuickSelectProps) {
  const options = customStatuses || statusOptions[statusType] || []

  return <QuickSelect options={options} {...props} />
}

// ============================================
// YES/NO QUICK SELECT
// ============================================
export interface YesNoQuickSelectProps extends Omit<QuickSelectProps<string>, 'options' | 'multiple'> {
  /** Custom labels */
  yesLabel?: string
  noLabel?: string
}

function YesNoQuickSelect({
  yesLabel = "Yes",
  noLabel = "No",
  ...props
}: YesNoQuickSelectProps) {
  const options: QuickSelectOption<string>[] = [
    { value: 'yes', label: yesLabel },
    { value: 'no', label: noLabel },
  ]

  return <QuickSelect options={options} layout="horizontal" {...props} />
}

export {
  QuickSelect,
  QuickSelectItem,
  StatusQuickSelect,
  YesNoQuickSelect,
  quickSelectVariants,
  quickSelectOptionVariants,
}
