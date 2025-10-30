import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardMobileLayout } from '@/components/mobile/dashboard-mobile-layout'

/**
 * Dashboard Layout - Fixed duplicate rendering issue
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Desktop Layout - shown on lg and up */}
      <div className="hidden lg:flex min-h-screen w-full">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </div>

      {/* Mobile Layout - shown below lg */}
      <div className="lg:hidden">
        <DashboardMobileLayout>{children}</DashboardMobileLayout>
      </div>
    </>
  )
}
