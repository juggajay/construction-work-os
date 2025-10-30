'use client'

import { useIsMobile } from '@/lib/hooks/use-mobile'
import { DashboardMobileLayout } from './dashboard-mobile-layout'

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Wrapper that conditionally renders mobile or desktop layout
 * to avoid double rendering both layouts
 */
export function ResponsiveDashboardLayout({ children }: ResponsiveDashboardLayoutProps) {
  const isMobile = useIsMobile()

  // During SSR or initial render, show both layouts with CSS hiding
  // After hydration, conditionally render based on screen size
  if (isMobile === undefined) {
    return <>{children}</>
  }

  // On mobile, wrap in mobile layout
  if (isMobile) {
    return <DashboardMobileLayout>{children}</DashboardMobileLayout>
  }

  // On desktop, just render children (desktop layout is in parent)
  return <>{children}</>
}
