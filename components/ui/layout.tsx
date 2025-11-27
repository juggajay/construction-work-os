"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ============================================
// PAGE CONTAINER
// Core wrapper for all pages with proper spacing
// ============================================
const pageContainerVariants = cva(
  [
    "min-h-screen w-full",
    // Safe areas for notched devices
    "supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)]",
    "supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]",
  ].join(" "),
  {
    variants: {
      // ============================================
      // BACKGROUND VARIANTS
      // ============================================
      background: {
        default: "bg-background",
        muted: "bg-muted",
        surface: "bg-surface-0 dark:bg-surface-0",
        transparent: "bg-transparent",
        gradient: [
          "bg-gradient-to-b from-construction-50/50 to-background",
          "dark:from-construction-950/20 dark:to-background",
        ].join(" "),
      },

      // ============================================
      // PADDING VARIANTS
      // ============================================
      padding: {
        none: "",
        sm: "px-3 py-4 md:px-4 md:py-6",
        default: "px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10",
        lg: "px-6 py-8 md:px-8 md:py-10 lg:px-12 lg:py-12",
        responsive: "px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-12 lg:py-10",
      },

      // ============================================
      // MAX WIDTH
      // ============================================
      maxWidth: {
        none: "",
        sm: "max-w-screen-sm mx-auto",
        md: "max-w-screen-md mx-auto",
        lg: "max-w-screen-lg mx-auto",
        xl: "max-w-screen-xl mx-auto",
        "2xl": "max-w-screen-2xl mx-auto",
        full: "max-w-full",
      },

      // ============================================
      // MOBILE NAVIGATION OFFSET
      // ============================================
      withBottomNav: {
        true: "pb-20 md:pb-0", // 80px for mobile bottom nav
        false: "",
      },

      withSidebar: {
        true: "md:pl-64", // 256px sidebar width
        false: "",
      },
    },

    defaultVariants: {
      background: "default",
      padding: "default",
      maxWidth: "2xl",
      withBottomNav: false,
      withSidebar: false,
    },
  }
)

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageContainerVariants> {
  /** Page transition key */
  transitionKey?: string
}

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({
    className,
    background,
    padding,
    maxWidth,
    withBottomNav,
    withSidebar,
    children,
    ...props
  }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          pageContainerVariants({
            background,
            padding,
            maxWidth,
            withBottomNav,
            withSidebar,
            className,
          })
        )}
        {...props}
      >
        {children}
      </main>
    )
  }
)
PageContainer.displayName = "PageContainer"

// ============================================
// SECTION
// Content section with title and spacing
// ============================================
const sectionVariants = cva(
  "",
  {
    variants: {
      // ============================================
      // SPACING
      // ============================================
      spacing: {
        none: "",
        sm: "space-y-3",
        default: "space-y-4 md:space-y-6",
        lg: "space-y-6 md:space-y-8",
        xl: "space-y-8 md:space-y-12",
      },

      // ============================================
      // MARGIN BOTTOM
      // ============================================
      mb: {
        none: "",
        sm: "mb-4",
        default: "mb-6 md:mb-8",
        lg: "mb-8 md:mb-12",
        xl: "mb-12 md:mb-16",
      },
    },

    defaultVariants: {
      spacing: "default",
      mb: "default",
    },
  }
)

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Right-side action element */
  action?: React.ReactNode
  /** As element type */
  as?: 'section' | 'div' | 'article'
  /** Title variant */
  titleSize?: 'sm' | 'default' | 'lg' | 'xl'
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({
    className,
    spacing,
    mb,
    title,
    description,
    action,
    as: Comp = "section",
    titleSize = "default",
    children,
    ...props
  }, ref) => {
    const titleClasses = {
      sm: "text-base font-semibold",
      default: "text-lg font-semibold md:text-xl",
      lg: "text-xl font-bold md:text-2xl",
      xl: "text-2xl font-bold md:text-3xl",
    }

    return (
      <Comp
        ref={ref as React.LegacyRef<HTMLDivElement>}
        className={cn(sectionVariants({ spacing, mb, className }))}
        {...props}
      >
        {(title || action) && (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {title && (
                <h2 className={cn(titleClasses[titleSize], "text-foreground")}>
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground md:text-base">
                  {description}
                </p>
              )}
            </div>
            {action && (
              <div className="shrink-0">
                {action}
              </div>
            )}
          </div>
        )}
        {children}
      </Comp>
    )
  }
)
Section.displayName = "Section"

// ============================================
// GRID
// Responsive grid layout system
// ============================================
const gridVariants = cva(
  "grid",
  {
    variants: {
      // ============================================
      // COLUMNS
      // ============================================
      cols: {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
        6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
        auto: "grid-cols-[repeat(auto-fill,minmax(280px,1fr))]",
        "auto-sm": "grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
        "auto-lg": "grid-cols-[repeat(auto-fill,minmax(350px,1fr))]",
      },

      // ============================================
      // GAP
      // ============================================
      gap: {
        none: "gap-0",
        xs: "gap-2",
        sm: "gap-3",
        default: "gap-4 md:gap-6",
        lg: "gap-6 md:gap-8",
        xl: "gap-8 md:gap-10",
      },

      // ============================================
      // ALIGNMENT
      // ============================================
      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
      },

      justify: {
        start: "justify-items-start",
        center: "justify-items-center",
        end: "justify-items-end",
        stretch: "justify-items-stretch",
      },
    },

    defaultVariants: {
      cols: 3,
      gap: "default",
      align: "stretch",
      justify: "stretch",
    },
  }
)

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, align, justify, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ cols, gap, align, justify, className }))}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Grid.displayName = "Grid"

// ============================================
// STACK
// Vertical or horizontal stack with gap
// ============================================
const stackVariants = cva(
  "flex",
  {
    variants: {
      direction: {
        vertical: "flex-col",
        horizontal: "flex-row",
        "responsive-h": "flex-col sm:flex-row",
        "responsive-v": "flex-row sm:flex-col",
      },

      gap: {
        none: "gap-0",
        xs: "gap-1",
        sm: "gap-2",
        default: "gap-4",
        lg: "gap-6",
        xl: "gap-8",
      },

      align: {
        start: "items-start",
        center: "items-center",
        end: "items-end",
        stretch: "items-stretch",
        baseline: "items-baseline",
      },

      justify: {
        start: "justify-start",
        center: "justify-center",
        end: "justify-end",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly",
      },

      wrap: {
        true: "flex-wrap",
        false: "flex-nowrap",
      },
    },

    defaultVariants: {
      direction: "vertical",
      gap: "default",
      align: "stretch",
      justify: "start",
      wrap: false,
    },
  }
)

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, direction, gap, align, justify, wrap, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(stackVariants({ direction, gap, align, justify, wrap, className }))}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Stack.displayName = "Stack"

// ============================================
// PAGE HEADER
// Standard page header with title, description, actions
// ============================================
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Page title */
  title: string
  /** Page description */
  description?: string
  /** Back button action */
  onBack?: () => void
  /** Right-side actions */
  actions?: React.ReactNode
  /** Breadcrumbs element */
  breadcrumbs?: React.ReactNode
  /** Status badge */
  status?: React.ReactNode
  /** Sticky header */
  sticky?: boolean
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({
    className,
    title,
    description,
    onBack,
    actions,
    breadcrumbs,
    status,
    sticky = false,
    ...props
  }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          "border-b border-border bg-background/95 backdrop-blur-sm",
          "px-4 py-4 md:px-6 md:py-6",
          sticky && "sticky top-0 z-40",
          className
        )}
        {...props}
      >
        {breadcrumbs && (
          <div className="mb-3 text-sm">
            {breadcrumbs}
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className={cn(
                    "shrink-0 rounded-lg p-2 -ml-2",
                    "text-muted-foreground hover:text-foreground hover:bg-accent",
                    "transition-colors duration-fast"
                  )}
                  aria-label="Go back"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="truncate text-xl font-bold text-foreground md:text-2xl lg:text-3xl">
                    {title}
                  </h1>
                  {status}
                </div>

                {description && (
                  <p className="mt-1 text-sm text-muted-foreground md:text-base">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {actions && (
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {actions}
            </div>
          )}
        </div>
      </header>
    )
  }
)
PageHeader.displayName = "PageHeader"

// ============================================
// CONTENT AREA
// Main content wrapper with consistent padding
// ============================================
const contentAreaVariants = cva(
  "",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-3 md:p-4",
        default: "p-4 md:p-6 lg:p-8",
        lg: "p-6 md:p-8 lg:p-10",
      },

      maxWidth: {
        none: "",
        prose: "max-w-prose",
        sm: "max-w-screen-sm",
        md: "max-w-screen-md",
        lg: "max-w-screen-lg",
        xl: "max-w-screen-xl",
      },
    },

    defaultVariants: {
      padding: "default",
      maxWidth: "none",
    },
  }
)

export interface ContentAreaProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof contentAreaVariants> {
  /** Center content horizontally */
  centered?: boolean
}

const ContentArea = React.forwardRef<HTMLDivElement, ContentAreaProps>(
  ({ className, padding, maxWidth, centered, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          contentAreaVariants({ padding, maxWidth, className }),
          centered && "mx-auto"
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ContentArea.displayName = "ContentArea"

// ============================================
// SPLIT LAYOUT
// Two-column layout (sidebar + main)
// ============================================
export interface SplitLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Left/sidebar content */
  sidebar: React.ReactNode
  /** Sidebar width */
  sidebarWidth?: 'sm' | 'default' | 'lg' | 'xl'
  /** Sidebar position */
  sidebarPosition?: 'left' | 'right'
  /** Sticky sidebar */
  stickySidebar?: boolean
}

const SplitLayout = React.forwardRef<HTMLDivElement, SplitLayoutProps>(
  ({
    className,
    sidebar,
    sidebarWidth = "default",
    sidebarPosition = "left",
    stickySidebar = false,
    children,
    ...props
  }, ref) => {
    const widthClasses = {
      sm: "w-full md:w-56",
      default: "w-full md:w-64",
      lg: "w-full md:w-80",
      xl: "w-full md:w-96",
    }

    const sidebarContent = (
      <aside
        className={cn(
          widthClasses[sidebarWidth],
          "shrink-0",
          stickySidebar && "md:sticky md:top-6 md:h-fit"
        )}
      >
        {sidebar}
      </aside>
    )

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-6 md:flex-row md:gap-8 lg:gap-12",
          sidebarPosition === "right" && "md:flex-row-reverse",
          className
        )}
        {...props}
      >
        {sidebarContent}
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
    )
  }
)
SplitLayout.displayName = "SplitLayout"

// ============================================
// DIVIDER
// Visual separator with optional label
// ============================================
export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Label text */
  label?: string
  /** Orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Variant */
  variant?: 'default' | 'dashed' | 'thick'
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, label, orientation = "horizontal", variant = "default", ...props }, ref) => {
    const baseClasses = {
      default: "border-border",
      dashed: "border-dashed border-border",
      thick: "border-2 border-border",
    }

    if (orientation === "vertical") {
      return (
        <div
          ref={ref}
          className={cn(
            "border-l h-full min-h-[16px]",
            baseClasses[variant],
            className
          )}
          role="separator"
          aria-orientation="vertical"
          {...props}
        />
      )
    }

    if (label) {
      return (
        <div
          ref={ref}
          className={cn("flex items-center gap-4", className)}
          role="separator"
          {...props}
        >
          <div className={cn("flex-1 border-t", baseClasses[variant])} />
          <span className="shrink-0 text-sm text-muted-foreground">
            {label}
          </span>
          <div className={cn("flex-1 border-t", baseClasses[variant])} />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("border-t", baseClasses[variant], className)}
        role="separator"
        {...props}
      />
    )
  }
)
Divider.displayName = "Divider"

// ============================================
// SPACER
// Flexible spacer for layouts
// ============================================
export interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fixed size */
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl'
  /** Flexible growth */
  flex?: boolean
}

const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
  ({ className, size, flex = false, ...props }, ref) => {
    const sizeClasses = {
      xs: "h-2",
      sm: "h-4",
      default: "h-6",
      lg: "h-8",
      xl: "h-12",
      "2xl": "h-16",
    }

    return (
      <div
        ref={ref}
        className={cn(
          flex ? "flex-1" : sizeClasses[size || "default"],
          className
        )}
        aria-hidden="true"
        {...props}
      />
    )
  }
)
Spacer.displayName = "Spacer"

export {
  PageContainer,
  Section,
  Grid,
  Stack,
  PageHeader,
  ContentArea,
  SplitLayout,
  Divider,
  Spacer,
  pageContainerVariants,
  sectionVariants,
  gridVariants,
  stackVariants,
  contentAreaVariants,
}
