import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const constructionBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      status: {
        "on-track": "bg-green-100 text-green-800 border border-green-200",
        "at-risk": "bg-yellow-100 text-yellow-800 border border-yellow-200",
        delayed: "bg-red-100 text-red-800 border border-red-200",
        completed: "bg-blue-100 text-blue-800 border border-blue-200",
      },
    },
    defaultVariants: {
      status: "on-track",
    },
  }
)

export interface ConstructionBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof constructionBadgeVariants> {}

function ConstructionBadge({
  className,
  status,
  children,
  ...props
}: ConstructionBadgeProps) {
  return (
    <div
      className={cn(constructionBadgeVariants({ status }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { ConstructionBadge, constructionBadgeVariants }
