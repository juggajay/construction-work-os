'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState, useCallback } from 'react'
import {
  Home,
  Building2,
  Users,
  Settings,
  Plus,
  FileText,
  ClipboardList,
  Calendar,
  DollarSign,
  X,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  orgSlug: string
  /** Show the floating action button */
  showFab?: boolean
  /** Custom FAB items */
  fabItems?: FabItem[]
}

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  matchPattern?: RegExp
}

interface FabItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color?: 'default' | 'construction' | 'success' | 'warning' | 'danger'
}

export function BottomNav({ orgSlug, showFab = true, fabItems: customFabItems }: BottomNavProps) {
  const pathname = usePathname()
  const [fabOpen, setFabOpen] = useState(false)

  // Memoize navItems to avoid recreating RegExp on every render
  const navItems: NavItem[] = useMemo(() => [
    {
      href: `/${orgSlug}`,
      icon: Home,
      label: 'Home',
      matchPattern: new RegExp(`^/${orgSlug}$`),
    },
    {
      href: `/${orgSlug}/projects`,
      icon: Building2,
      label: 'Projects',
      matchPattern: new RegExp(`^/${orgSlug}/projects`),
    },
    {
      href: `/${orgSlug}/team`,
      icon: Users,
      label: 'Team',
      matchPattern: new RegExp(`^/${orgSlug}/team`),
    },
    {
      href: `/${orgSlug}/settings`,
      icon: Settings,
      label: 'More',
      matchPattern: new RegExp(`^/${orgSlug}/settings`),
    },
  ], [orgSlug])

  // Default FAB quick action items
  const defaultFabItems: FabItem[] = useMemo(() => [
    {
      href: `/${orgSlug}/daily-reports/new`,
      icon: Calendar,
      label: 'Daily Report',
      color: 'construction',
    },
    {
      href: `/${orgSlug}/rfis/new`,
      icon: FileText,
      label: 'New RFI',
      color: 'default',
    },
    {
      href: `/${orgSlug}/submittals/new`,
      icon: ClipboardList,
      label: 'Submittal',
      color: 'default',
    },
    {
      href: `/${orgSlug}/change-orders/new`,
      icon: DollarSign,
      label: 'Change Order',
      color: 'warning',
    },
    {
      href: `/${orgSlug}/snag-list/new`,
      icon: Wrench,
      label: 'Snag Item',
      color: 'default',
    },
  ], [orgSlug])

  const fabItems = customFabItems || defaultFabItems

  const isActive = useCallback((item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname)
    }
    return pathname === item.href
  }, [pathname])

  const toggleFab = useCallback(() => {
    setFabOpen(prev => !prev)
  }, [])

  const closeFab = useCallback(() => {
    setFabOpen(false)
  }, [])

  const colorClasses: Record<string, string> = {
    default: 'bg-surface-2 text-foreground hover:bg-surface-3 dark:bg-surface-3 dark:hover:bg-surface-4',
    construction: 'bg-construction-500 text-white hover:bg-construction-600 dark:bg-construction-500 dark:hover:bg-construction-400',
    success: 'bg-success text-white hover:bg-success/90',
    warning: 'bg-warning text-white hover:bg-warning/90',
    danger: 'bg-danger text-white hover:bg-danger/90',
  }

  return (
    <>
      {/* FAB Overlay */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={closeFab}
          aria-hidden="true"
        />
      )}

      {/* FAB Menu */}
      {showFab && (
        <div
          className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2 z-50 lg:hidden",
            "flex flex-col items-center gap-3",
            "transition-all duration-300 ease-out",
            fabOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-8 pointer-events-none"
          )}
        >
          {fabItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeFab}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl",
                  "shadow-lg min-w-touch-lg",
                  "transition-all duration-200",
                  "animate-in fade-in slide-in-from-bottom-4",
                  colorClasses[item.color || 'default']
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'both',
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Floating Action Button */}
      {showFab && (
        <button
          onClick={toggleFab}
          className={cn(
            "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 lg:hidden",
            "h-14 w-14 rounded-full",
            "flex items-center justify-center",
            "shadow-xl shadow-construction/30",
            "transition-all duration-300 ease-out",
            "active:scale-95",
            fabOpen
              ? "bg-surface-3 text-foreground rotate-45 dark:bg-surface-4"
              : "bg-gradient-construction text-white dark:shadow-glow-construction"
          )}
          aria-label={fabOpen ? "Close quick actions" : "Open quick actions"}
          aria-expanded={fabOpen}
        >
          {fabOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
          // Glass morphism effect
          "bg-white/80 dark:bg-surface-0/80",
          "backdrop-blur-glass",
          "border-t border-white/20 dark:border-white/10",
          // Safe area support
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1",
                  "transition-all duration-fast touch-manipulation",
                  "active:scale-95",
                  // Touch target
                  "min-h-touch-lg",
                  active
                    ? "text-construction-500 dark:text-construction-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center w-10 h-8 rounded-xl",
                    "transition-all duration-normal",
                    active && "bg-construction-100 dark:bg-construction-500/20"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-normal",
                      active && "scale-110"
                    )}
                  />
                  {/* Active indicator dot */}
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-construction-500 dark:bg-construction-400" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    active && "text-construction-600 dark:text-construction-300"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

// ============================================
// STANDALONE FAB COMPONENT
// For use on specific pages
// ============================================
export interface FloatingActionButtonProps {
  /** Click handler */
  onClick?: () => void
  /** Link href (alternative to onClick) */
  href?: string
  /** Icon to display */
  icon?: React.ReactNode
  /** Accessible label */
  label: string
  /** Position */
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left'
  /** Variant */
  variant?: 'construction' | 'default' | 'success'
  /** Size */
  size?: 'default' | 'lg'
  /** Extended label (shown next to icon) */
  extended?: boolean
  /** Additional class names */
  className?: string
}

export function FloatingActionButton({
  onClick,
  href,
  icon = <Plus className="h-6 w-6" />,
  label,
  position = 'bottom-right',
  variant = 'construction',
  size = 'default',
  extended = false,
  className,
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'right-4 bottom-24 md:bottom-6',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-24 md:bottom-6',
    'bottom-left': 'left-4 bottom-24 md:bottom-6',
  }

  const variantClasses = {
    construction: [
      'bg-gradient-construction text-white',
      'shadow-xl shadow-construction/30',
      'hover:shadow-2xl hover:shadow-construction/40',
      'dark:shadow-glow-construction',
    ].join(' '),
    default: [
      'bg-card text-foreground border border-border',
      'shadow-lg hover:shadow-xl',
      'dark:bg-surface-2 dark:border-white/10',
    ].join(' '),
    success: [
      'bg-success text-white',
      'shadow-xl shadow-success/30',
      'hover:shadow-2xl hover:shadow-success/40',
    ].join(' '),
  }

  const sizeClasses = {
    default: extended ? 'h-14 px-6 rounded-full gap-2' : 'h-14 w-14 rounded-full',
    lg: extended ? 'h-16 px-8 rounded-full gap-3' : 'h-16 w-16 rounded-full',
  }

  const baseClasses = cn(
    "fixed z-40",
    "flex items-center justify-center",
    "transition-all duration-normal ease-out",
    "active:scale-95",
    positionClasses[position],
    variantClasses[variant],
    sizeClasses[size],
    className
  )

  const content = (
    <>
      {icon}
      {extended && <span className="font-semibold">{label}</span>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={baseClasses} aria-label={label}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={baseClasses} aria-label={label}>
      {content}
    </button>
  )
}
