'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { Home, Building2, Users, Settings, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  orgSlug: string
}

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  matchPattern?: RegExp
}

export function BottomNav({ orgSlug }: BottomNavProps) {
  const pathname = usePathname()

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
      href: `/${orgSlug}/projects/new`,
      icon: Plus,
      label: 'Add',
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
      label: 'Settings',
      matchPattern: new RegExp(`^/${orgSlug}/settings`),
    },
  ], [orgSlug])

  const isActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname)
    }
    return pathname === item.href
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-manipulation',
                active
                  ? 'text-construction-500 dark:text-construction-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-construction-500 dark:hover:text-construction-400'
              )}
            >
              <Icon
                className={cn('h-6 w-6 transition-transform', active && 'scale-110')}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
