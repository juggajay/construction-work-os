import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { notFound } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { PageTransitionProvider } from '@/components/motion/page-transition-provider'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const org = await getOrganizationBySlug(orgSlug)

  if (!org) {
    notFound()
  }

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar orgSlug={orgSlug} />
      <main className="flex-1 min-w-0 overflow-x-hidden p-6">
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>
      </main>
    </div>
  )
}
