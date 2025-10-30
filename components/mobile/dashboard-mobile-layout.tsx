'use client'

import { useParams } from 'next/navigation'
import { BottomNav } from './bottom-nav'
import { MobileHeader } from './mobile-header'

interface DashboardMobileLayoutProps {
  children: React.ReactNode
}

export function DashboardMobileLayout({ children }: DashboardMobileLayoutProps) {
  const params = useParams()

  // Validate orgSlug type before using
  const orgSlug = typeof params.orgSlug === 'string' ? params.orgSlug : null

  // Only render if we have an orgSlug (inside organization context)
  if (!orgSlug) {
    return (
      <div className="lg:hidden min-h-screen">
        <main className="p-4">{children}</main>
      </div>
    )
  }

  return (
    <div className="lg:hidden min-h-screen flex flex-col">
      <MobileHeader />
      <main className="flex-1 p-4 pb-20">
        {children}
      </main>
      <BottomNav orgSlug={orgSlug} />
    </div>
  )
}
