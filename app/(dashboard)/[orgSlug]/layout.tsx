import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/app-header'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgSlug: string }
}) {
  const org = await getOrganizationBySlug(params.orgSlug)

  if (!org) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader currentOrgSlug={params.orgSlug} />
      <main className="flex-1 bg-neutral-50">{children}</main>
    </div>
  )
}
