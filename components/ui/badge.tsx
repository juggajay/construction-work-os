import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border font-semibold transition-all duration-fast focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Primary variants
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 dark:shadow-none",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-white/10 dark:text-foreground dark:hover:bg-white/15",

        // Status variants with proper dark mode contrast
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
        success:
          "border-transparent bg-green-500 text-white shadow-sm hover:bg-green-600 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30",
        warning:
          "border-transparent bg-amber-500 text-white shadow-sm hover:bg-amber-600 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
        info:
          "border-transparent bg-blue-500 text-white shadow-sm hover:bg-blue-600 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",

        // Construction theme
        construction:
          "border-transparent bg-construction-500 text-white shadow-sm hover:bg-construction-600 dark:bg-construction-500/20 dark:text-construction-400 dark:border-construction-500/30",

        // Subtle variants (softer, less prominent)
        "subtle-success":
          "border-transparent bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
        "subtle-warning":
          "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
        "subtle-destructive":
          "border-transparent bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
        "subtle-info":
          "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
        "subtle-construction":
          "border-transparent bg-construction-100 text-construction-700 dark:bg-construction-500/10 dark:text-construction-400",

        // Outline variants
        outline:
          "text-foreground border-border dark:border-white/20",
        "outline-success":
          "text-green-600 border-green-300 dark:text-green-400 dark:border-green-500/40",
        "outline-warning":
          "text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-500/40",
        "outline-destructive":
          "text-red-600 border-red-300 dark:text-red-400 dark:border-red-500/40",
        "outline-construction":
          "text-construction-600 border-construction-300 dark:text-construction-400 dark:border-construction-500/40",
      },
      /** Size variants */
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
        /** Touch-friendly for field workers */
        touch: "px-3 py-1.5 text-sm min-h-[32px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
