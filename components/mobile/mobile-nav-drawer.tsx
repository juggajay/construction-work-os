'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Home,
  Settings,
  FileText,
  Users,
  BarChart3,
  HardHat,
  ClipboardList,
  DollarSign,
  Calendar,
  Wrench,
  TrendingUp,
  Activity,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { LogoutButton } from '@/components/logout-button'
import { slideFromRightVariants, overlayVariants } from '@/lib/motion/variants'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
  orgSlug?: string
}

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  disabled?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function MobileNavDrawer({ open, onClose, orgSlug }: MobileNavDrawerProps) {
  const pathname = usePathname()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const navigation: NavSection[] = orgSlug
    ? [
        {
          title: 'Overview',
          items: [
            { title: 'Dashboard', icon: Home, href: `/${orgSlug}` },
            { title: 'Projects', icon: Building2, href: `/${orgSlug}/projects` },
          ],
        },
        {
          title: 'Work',
          items: [
            { title: 'RFIs', icon: FileText, href: `/${orgSlug}/rfis` },
            { title: 'Submittals', icon: ClipboardList, href: `/${orgSlug}/submittals` },
            { title: 'Change Orders', icon: DollarSign, href: `/${orgSlug}/change-orders` },
            { title: 'Daily Reports', icon: Calendar, href: `/${orgSlug}/daily-reports` },
            { title: 'Snag List', icon: Wrench, href: `/${orgSlug}/snag-list` },
          ],
        },
        {
          title: 'Insights',
          items: [
            { title: 'Project Health', icon: Activity, href: `/${orgSlug}/project-health` },
            { title: 'Analytics', icon: TrendingUp, href: `/${orgSlug}/analytics` },
            { title: 'Reports', icon: BarChart3, href: `/${orgSlug}/reports`, disabled: true },
          ],
        },
        {
          title: 'Settings',
          items: [
            { title: 'Team', icon: Users, href: `/${orgSlug}/team` },
            { title: 'Organization', icon: Building2, href: `/${orgSlug}/settings`, disabled: true },
            { title: 'Settings', icon: Settings, href: `/${orgSlug}/settings/general`, disabled: true },
          ],
        },
      ]
    : [
        {
          title: 'Overview',
          items: [
            { title: 'Dashboard', icon: Home, href: '/dashboard' },
            { title: 'Organizations', icon: Building2, href: '/orgs' },
          ],
        },
      ]

  const isActive = (href: string) => {
    if (href === `/${orgSlug}` || href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial="initial"
            animate="enter"
            exit="exit"
            variants={overlayVariants}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            initial="initial"
            animate="enter"
            exit="exit"
            variants={slideFromRightVariants}
            className={cn(
              'fixed right-0 top-0 z-50 h-full w-[85vw] max-w-sm',
              'bg-background dark:bg-[hsl(var(--depth-1))]',
              'shadow-2xl dark:shadow-none dark:border-l dark:border-white/10',
              'flex flex-col',
              'safe-area-inset-top safe-area-inset-right safe-area-inset-bottom'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b dark:border-white/10">
              <Link
                href="/dashboard"
                className="flex items-center gap-2"
                onClick={onClose}
              >
                <HardHat className="h-7 w-7 text-construction-500" />
                <span className="font-bold text-lg">Construction OS</span>
              </Link>
              <Button
                variant="ghost"
                size="touch-icon"
                onClick={onClose}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              {navigation.map((section) => (
                <div key={section.title} className="mb-4">
                  <h3 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </h3>
                  <ul className="space-y-1 px-2">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.href)

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.disabled ? '#' : item.href}
                            onClick={item.disabled ? undefined : onClose}
                            className={cn(
                              'flex items-center gap-3 px-3 py-3 rounded-lg min-h-touch',
                              'transition-colors duration-fast touch-manipulation',
                              active
                                ? 'bg-construction-500/10 text-construction-600 dark:text-construction-400 font-medium'
                                : 'text-foreground hover:bg-muted',
                              item.disabled && 'opacity-50 cursor-not-allowed'
                            )}
                            aria-current={active ? 'page' : undefined}
                            aria-disabled={item.disabled}
                          >
                            <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-construction-500')} />
                            <span className="flex-1">{item.title}</span>
                            {active && (
                              <ChevronRight className="h-4 w-4 text-construction-500" />
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
            <div className="border-t dark:border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <LogoutButton className="w-full" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
