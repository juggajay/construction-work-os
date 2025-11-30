import { Suspense } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardMobileLayout } from '@/components/mobile/dashboard-mobile-layout'

/**
 * Organizations Layout (non-org routes)
 * Renders sidebar without orgSlug for /orgs routes
 */
export default function OrgsLayout({
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
