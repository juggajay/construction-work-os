import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { notFound } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgSlug: string }
}) {
  const org = await getOrganizationBySlug(params.orgSlug)

  if (!org) {
    notFound()
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar orgSlug={params.orgSlug} />
        <SidebarInset className="flex-1">
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
