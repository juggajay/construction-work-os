'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Home,
  Settings,
  FileText,
  Users,
  BarChart3,
  Search,
  ClipboardList,
  DollarSign,
  Calendar,
  Wrench,
  TrendingUp,
  Activity,
  Bell,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

// ============================================================================
// INDUSTRIAL LUXURY SIDEBAR
// Dark, refined, amber accents
// ============================================================================

interface AppSidebarProps {
  orgSlug?: string
  onSearchClick?: () => void
  notificationCount?: number
}

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  disabled?: boolean
  badge?: string | number
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function AppSidebar({ orgSlug, onSearchClick, notificationCount = 0 }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onSearchClick?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSearchClick])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navigation: NavSection[] = orgSlug
    ? [
        {
          title: '',
          items: [
            { title: 'Dashboard', icon: Home, href: `/${orgSlug}` },
            { title: 'Projects', icon: Building2, href: `/${orgSlug}/projects` },
          ],
        },
        {
          title: 'WORKFLOWS',
          items: [
            { title: 'RFIs', icon: FileText, href: `/${orgSlug}/rfis` },
            { title: 'Submittals', icon: ClipboardList, href: `/${orgSlug}/submittals` },
            { title: 'Change Orders', icon: DollarSign, href: `/${orgSlug}/change-orders` },
            { title: 'Daily Reports', icon: Calendar, href: `/${orgSlug}/daily-reports` },
            { title: 'Snag List', icon: Wrench, href: `/${orgSlug}/snag-list` },
          ],
        },
        {
          title: 'INSIGHTS',
          items: [
            { title: 'Project Health', icon: Activity, href: `/${orgSlug}/project-health` },
            { title: 'Analytics', icon: TrendingUp, href: `/${orgSlug}/analytics` },
          ],
        },
        {
          title: '',
          items: [
            { title: 'Team', icon: Users, href: `/${orgSlug}/team` },
            { title: 'Settings', icon: Settings, href: `/${orgSlug}/settings/general`, disabled: true },
          ],
        },
      ]
    : [
        {
          title: '',
          items: [
            { title: 'Dashboard', icon: Home, href: '/dashboard' },
            { title: 'Organizations', icon: Building2, href: '/orgs' },
          ],
        },
      ]

  const isItemActive = useCallback((item: NavItem) => {
    if (pathname === item.href) return true
    if (item.href !== `/${orgSlug}` && pathname.startsWith(item.href)) return true
    return false
  }, [pathname, orgSlug])

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed left-0 top-0 h-screen z-40",
        "flex flex-col",
        "bg-[#0a0a0a] border-r border-white/[0.06]"
      )}
    >
      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="relative p-4 space-y-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0",
            "bg-gradient-to-br from-amber-400 to-amber-600",
            "shadow-lg shadow-amber-500/20",
            "transition-all duration-300",
            "group-hover:shadow-xl group-hover:shadow-amber-500/30"
          )}>
            <Building2 className="h-5 w-5 text-black" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-semibold text-white tracking-tight">
                  Construction<span className="text-amber-400">OS</span>
                </span>
                {orgSlug && (
                  <span className="text-xs text-white/40 truncate">{orgSlug}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Search */}
        {!isCollapsed && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onSearchClick}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2.5",
              "rounded-xl",
              "bg-white/[0.03] border border-white/[0.06]",
              "text-sm text-white/40",
              "transition-all duration-200",
              "hover:bg-white/[0.06] hover:border-white/10 hover:text-white/60"
            )}
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search...</span>
            {mounted && (
              <kbd className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            )}
          </motion.button>
        )}

        {/* Quick action - collapsed search */}
        {isCollapsed && (
          <button
            onClick={onSearchClick}
            className={cn(
              "flex items-center justify-center",
              "h-10 w-10 rounded-xl",
              "bg-white/[0.03] border border-white/[0.06]",
              "text-white/40 hover:text-white/60 hover:bg-white/[0.06]",
              "transition-all duration-200"
            )}
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        {/* New Daily Report button */}
        {orgSlug && !isCollapsed && (
          <Link
            href={`/${orgSlug}/daily-reports/new`}
            className={cn(
              "flex items-center justify-center gap-2",
              "h-10 rounded-xl",
              "bg-gradient-to-r from-amber-500 to-amber-600 text-black",
              "text-sm font-medium",
              "transition-all duration-200",
              "hover:shadow-lg hover:shadow-amber-500/25",
              "active:scale-[0.98]"
            )}
          >
            <Plus className="h-4 w-4" />
            <span>New Report</span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-thin">
        {navigation.map((section, sectionIndex) => (
          <div key={section.title || sectionIndex} className="mb-6">
            {section.title && !isCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = isItemActive(item)

                return (
                  <li key={item.title}>
                    <Link
                      href={item.disabled ? '#' : item.href}
                      onClick={e => item.disabled && e.preventDefault()}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl",
                        "text-sm font-medium transition-all duration-200",
                        isCollapsed && "justify-center px-0",
                        // Default state
                        !isActive && !item.disabled && [
                          "text-white/50",
                          "hover:text-white/80 hover:bg-white/[0.04]",
                        ],
                        // Active state
                        isActive && [
                          "text-white bg-white/[0.08]",
                        ],
                        // Disabled
                        item.disabled && "opacity-30 cursor-not-allowed"
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-amber-500"
                          transition={{ duration: 0.2 }}
                        />
                      )}

                      <Icon className={cn(
                        "h-[18px] w-[18px] flex-shrink-0",
                        isActive ? "text-amber-400" : "text-inherit"
                      )} />

                      {!isCollapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                              {item.badge}
                            </span>
                          )}
                          {item.disabled && (
                            <span className="text-[10px] text-white/30">Soon</span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="relative p-3 border-t border-white/[0.06] space-y-2">
        {/* Notifications */}
        <button
          className={cn(
            "relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl",
            "text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04]",
            "transition-all duration-200",
            isCollapsed && "justify-center px-0"
          )}
        >
          <div className="relative">
            <Bell className="h-[18px] w-[18px]" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[9px] font-bold bg-red-500 text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </div>
          {!isCollapsed && <span>Notifications</span>}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl",
            "text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04]",
            "transition-all duration-200",
            isCollapsed && "justify-center px-0"
          )}
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
          {!isCollapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl",
            "text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10",
            "transition-all duration-200",
            isCollapsed && "justify-center px-0",
            isLoggingOut && "opacity-50 cursor-not-allowed"
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {!isCollapsed && <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center justify-center gap-2 w-full py-2 rounded-xl",
            "text-white/30 hover:text-white/50 hover:bg-white/[0.02]",
            "transition-all duration-200"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
