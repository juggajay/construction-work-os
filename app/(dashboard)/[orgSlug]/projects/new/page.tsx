import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { redirect } from 'next/navigation'
import { ProjectForm } from './project-form'
import type { Organization } from '@/lib/types'

export default async function NewProjectPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  const orgResult = await getOrganizationBySlug(params.orgSlug)

  if (!orgResult) {
    redirect('/dashboard')
  }

  const org = orgResult as Organization

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <ProjectForm orgId={org.id} orgSlug={params.orgSlug} />
    </div>
  )
}
