import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { ResponsiveDashboardLayout } from '@/components/mobile/responsive-dashboard-layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ResponsiveDashboardLayout>
      {/* Desktop Layout - hidden on mobile */}
      <SidebarProvider>
        <div className="hidden lg:flex min-h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* Mobile Layout injected by ResponsiveDashboardLayout */}
      {children}
    </ResponsiveDashboardLayout>
  )
}
