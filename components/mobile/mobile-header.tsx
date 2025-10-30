'use client'

import { HardHat, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  onMenuClick?: () => void
  className?: string
}

export function MobileHeader({ title, showBack, onMenuClick, className }: MobileHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 lg:hidden',
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 safe-area-inset-top">
        {/* Left Side */}
        <div className="flex items-center gap-2">
          {onMenuClick ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 touch-manipulation"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/dashboard" className="flex items-center">
              <HardHat className="h-6 w-6 text-construction-500" />
            </Link>
          )}
          {title && (
            <h1 className="text-lg font-semibold truncate max-w-[200px]">{title}</h1>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 touch-manipulation"
          >
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
