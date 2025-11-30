import { Suspense } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardMobileLayout } from '@/components/mobile/dashboard-mobile-layout'

/**
 * Dashboard Home Layout (non-org routes)
 * Renders sidebar without orgSlug for /dashboard route
 */
export default function DashboardHomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Desktop Layout - shown on lg and up */}
      <div className="hidden lg:block">
        <AppSidebar />
        <div className="ml-[260px] min-h-screen p-6">{children}</div>
      </div>

      {/* Mobile Layout - shown below lg */}
      <div className="lg:hidden">
        <Suspense fallback={<div className="min-h-screen p-4">{children}</div>}>
          <DashboardMobileLayout>{children}</DashboardMobileLayout>
        </Suspense>
      </div>
    </>
  )
}
