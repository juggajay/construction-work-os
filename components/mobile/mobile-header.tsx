'use client'

import { useState } from 'react'
import { HardHat, Menu, Search, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { MobileNavDrawer } from '@/components/mobile/mobile-nav-drawer'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  title?: string
  /** Show back button instead of menu */
  showBack?: boolean
  /** Custom back handler (defaults to router.back) */
  onBack?: () => void
  /** Organization slug for navigation */
  orgSlug?: string
  /** Hide the search button */
  hideSearch?: boolean
  /** Hide the theme toggle */
  hideThemeToggle?: boolean
  className?: string
}

export function MobileHeader({
  title,
  showBack,
  onBack,
  orgSlug,
  hideSearch,
  hideThemeToggle,
  className,
}: MobileHeaderProps) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 lg:hidden',
          'bg-background/80 dark:bg-[hsl(var(--depth-1))]/80',
          'backdrop-blur-lg border-b border-border dark:border-white/10',
          'safe-area-inset-top',
          className
        )}
      >
        <div className="flex items-center justify-between h-14 px-2">
          {/* Left Side */}
          <div className="flex items-center gap-1">
            {showBack ? (
              <Button
                variant="ghost"
                size="touch-icon"
                onClick={handleBack}
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="touch-icon"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            {title ? (
              <h1 className="text-lg font-semibold truncate max-w-[180px]">{title}</h1>
            ) : (
              <Link href="/dashboard" className="flex items-center gap-2 ml-1">
                <HardHat className="h-6 w-6 text-construction-500" />
                <span className="font-bold hidden xs:inline">Construction OS</span>
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center">
            {!hideSearch && (
              <Button
                variant="ghost"
                size="touch-icon"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
            {!hideThemeToggle && <ThemeToggle />}
          </div>
        </div>
      </header>

      {/* Navigation Drawer */}
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        orgSlug={orgSlug}
      />
    </>
  )
}
