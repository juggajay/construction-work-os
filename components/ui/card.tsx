import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-all duration-normal ease-smooth",
  {
    variants: {
      /** Dark mode depth level (0-4) - higher = more elevated */
      depth: {
        0: "shadow-sm dark:bg-[hsl(var(--depth-0))] dark:border-white/5",
        1: "shadow dark:bg-[hsl(var(--depth-1))] dark:border-white/10",
        2: "shadow-md dark:bg-[hsl(var(--depth-2))] dark:border-white/10",
        3: "shadow-lg dark:bg-[hsl(var(--depth-3))] dark:border-white/15",
        4: "shadow-xl dark:bg-[hsl(var(--depth-4))] dark:border-white/15",
      },
      /** Enable hover effects for interactive cards */
      hoverable: {
        true: "cursor-pointer hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-glow-construction dark:hover:border-construction-500/30",
        false: "",
      },
      /** Padding size */
      padding: {
        none: "",
        sm: "[&>*]:p-4",
        default: "",
        lg: "[&>*]:p-8",
      },
    },
    defaultVariants: {
      depth: 1,
      hoverable: false,
      padding: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, depth, hoverable, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ depth, hoverable, padding, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
