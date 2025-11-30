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
    <>
      <AppSidebar orgSlug={orgSlug} />
      <div className="ml-[260px] min-h-screen">
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>
      </div>
    </>
  )
}
