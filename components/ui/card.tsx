import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva(
  // Base styles - Apple/Stripe inspired
  [
    "rounded-2xl border bg-card text-card-foreground",
    "transition-all duration-normal ease-out",
  ].join(" "),
  {
    variants: {
      // ============================================
      // CARD VARIANTS
      // ============================================
      variant: {
        default: "border-border shadow-sm",

        elevated: [
          "border-transparent shadow-lg",
          "dark:shadow-none dark:border-white/5",
        ].join(" "),

        outline: [
          "border-border bg-transparent shadow-none",
        ].join(" "),

        ghost: [
          "border-transparent bg-transparent shadow-none",
        ].join(" "),

        glass: [
          "bg-white/70 backdrop-blur-glass border-white/30 shadow-glass",
          "dark:bg-black/40 dark:border-white/10",
        ].join(" "),

        "glass-heavy": [
          "bg-white/85 backdrop-blur-glass-lg border-white/40 shadow-glass-lg",
          "dark:bg-black/60 dark:border-white/15",
        ].join(" "),

        interactive: [
          "border-border shadow-sm cursor-pointer",
          "hover:border-construction/30 hover:shadow-lg hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-md",
          "dark:hover:border-construction/40 dark:hover:shadow-glow-construction-sm",
        ].join(" "),

        highlighted: [
          "bg-gradient-to-br from-construction-50 to-white border-construction-200 shadow-construction/10",
          "dark:from-construction/10 dark:to-transparent dark:border-construction/30",
        ].join(" "),

        success: [
          "bg-success-muted border-success/20",
          "dark:bg-success/10 dark:border-success/30",
        ].join(" "),

        warning: [
          "bg-warning-muted border-warning/20",
          "dark:bg-warning/10 dark:border-warning/30",
        ].join(" "),

        danger: [
          "bg-danger-muted border-danger/20",
          "dark:bg-danger/10 dark:border-danger/30",
        ].join(" "),

        info: [
          "bg-info-muted border-info/20",
          "dark:bg-info/10 dark:border-info/30",
        ].join(" "),
      },

      // ============================================
      // DARK MODE DEPTH (Elevation through brightness)
      // ============================================
      depth: {
        0: "dark:bg-surface-0 dark:border-white/5",
        1: "dark:bg-surface-1 dark:border-white/8",
        2: "dark:bg-surface-2 dark:border-white/10",
        3: "dark:bg-surface-3 dark:border-white/12",
        4: "dark:bg-surface-4 dark:border-white/15",
      },

      // ============================================
      // PADDING
      // ============================================
      padding: {
        none: "",
        xs: "p-2",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
        xl: "p-10",
        responsive: "p-4 md:p-6 lg:p-8",
      },

      // ============================================
      // HOVER EFFECTS
      // ============================================
      hover: {
        none: "",
        lift: [
          "hover:-translate-y-1 hover:shadow-xl",
          "dark:hover:shadow-glow-construction-sm",
        ].join(" "),
        glow: [
          "hover:shadow-construction",
          "dark:hover:shadow-glow-construction",
        ].join(" "),
        scale: "hover:scale-[1.02]",
        border: [
          "hover:border-construction/50",
          "dark:hover:border-construction/40",
        ].join(" "),
      },

      // ============================================
      // SIZE
      // ============================================
      size: {
        default: "",
        sm: "rounded-xl",
        lg: "rounded-3xl",
        full: "rounded-3xl md:rounded-4xl",
      },

      // ============================================
      // CLICKABLE
      // ============================================
      clickable: {
        true: "cursor-pointer",
        false: "",
      },
    },

    defaultVariants: {
      variant: "default",
      depth: 1,
      padding: "none", // Let CardContent handle padding
      hover: "none",
      size: "default",
      clickable: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Make the entire card a link */
  asChild?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, depth, padding, hover, size, clickable, asChild, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "div"
    const cardProps = asChild ? {} : { ref, ...props }

    return (
      <Comp {...cardProps}>
        <div
          ref={asChild ? undefined : ref}
          className={cn(cardVariants({ variant, depth, padding, hover, size, clickable, className }))}
          {...(asChild ? props : {})}
        />
      </Comp>
    )
  }
)
Card.displayName = "Card"

// ============================================
// CARD HEADER
// ============================================
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Add bottom border */
    bordered?: boolean
  }
>(({ className, bordered, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      bordered && "border-b border-border pb-4",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// ============================================
// CARD TITLE
// ============================================
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  }
>(({ className, as: Comp = 'h3', ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

// ============================================
// CARD DESCRIPTION
// ============================================
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

// ============================================
// CARD CONTENT
// ============================================
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Remove default padding */
    noPadding?: boolean
  }
>(({ className, noPadding, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(noPadding ? "" : "p-6 pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

// ============================================
// CARD FOOTER
// ============================================
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    /** Add top border */
    bordered?: boolean
  }
>(({ className, bordered, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      bordered && "border-t border-border pt-4 mt-4",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// ============================================
// CARD ACTION (For interactive cards)
// ============================================
const CardAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute top-4 right-4",
      className
    )}
    {...props}
  />
))
CardAction.displayName = "CardAction"

// ============================================
// STAT CARD COMPONENT
// ============================================
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface StatCardProps extends Omit<CardProps, 'children'> {
  /** Card label/title */
  label: string
  /** Main value to display */
  value: string | number
  /** Optional prefix (e.g., "$") */
  prefix?: string
  /** Optional suffix (e.g., "%") */
  suffix?: string
  /** Change from previous period */
  change?: {
    value: number
    label?: string
  }
  /** Icon to display */
  icon?: React.ReactNode
  /** Loading state */
  loading?: boolean
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({
    label,
    value,
    prefix,
    suffix,
    change,
    icon,
    loading,
    className,
    variant = "default",
    ...props
  }, ref) => {
    const changeDirection = change
      ? change.value > 0 ? 'up' : change.value < 0 ? 'down' : 'neutral'
      : null

    const ChangeIcon = changeDirection === 'up'
      ? TrendingUp
      : changeDirection === 'down'
        ? TrendingDown
        : Minus

    return (
      <Card
        ref={ref}
        variant={variant}
        padding="default"
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            {loading ? (
              <div className="h-8 w-24 skeleton-shimmer rounded" />
            ) : (
              <p className="text-2xl font-bold tracking-tight">
                {prefix}
                {typeof value === 'number' ? value.toLocaleString() : value}
                {suffix}
              </p>
            )}
            {change && !loading && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                changeDirection === 'up' && "text-success",
                changeDirection === 'down' && "text-danger",
                changeDirection === 'neutral' && "text-muted-foreground"
              )}>
                <ChangeIcon className="h-4 w-4" />
                <span>{Math.abs(change.value)}%</span>
                {change.label && (
                  <span className="text-muted-foreground font-normal">
                    {change.label}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="rounded-xl bg-construction/10 p-3 text-construction dark:bg-construction/20">
              {icon}
            </div>
          )}
        </div>
      </Card>
    )
  }
)
StatCard.displayName = "StatCard"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  StatCard,
  cardVariants
}
