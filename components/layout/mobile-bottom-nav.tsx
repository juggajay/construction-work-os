'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, Plus, FileText, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  orgSlug?: string
}

export function MobileBottomNav({ orgSlug }: MobileBottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      href: orgSlug ? `/${orgSlug}` : '/dashboard',
      primary: false,
    },
    {
      icon: Building2,
      label: 'Projects',
      href: orgSlug ? `/${orgSlug}/projects` : '/orgs',
      primary: false,
    },
    {
      icon: Plus,
      label: 'Add',
      href: orgSlug ? `/${orgSlug}/quick-add` : '/dashboard',
      primary: true,
    },
    {
      icon: FileText,
      label: 'RFIs',
      href: orgSlug ? `/${orgSlug}/rfis` : '/dashboard',
      primary: false,
    },
    {
      icon: Menu,
      label: 'More',
      href: orgSlug ? `/${orgSlug}/menu` : '/dashboard',
      primary: false,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t">
      <div className="grid grid-cols-5 p-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  'flex flex-col items-center justify-center py-2 w-full min-h-[56px]',
                  'text-xs font-medium transition-colors',
                  item.primary
                    ? 'text-construction-orange'
                    : isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'mb-1',
                    item.primary ? 'h-7 w-7' : 'h-5 w-5'
                  )}
                />
                <span>{item.label}</span>
              </button>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
