import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { redirect } from 'next/navigation'
import { ProjectForm } from './project-form'

export default async function NewProjectPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  const org = await getOrganizationBySlug(params.orgSlug)

  if (!org) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <ProjectForm orgId={org.id} orgSlug={params.orgSlug} />
    </div>
  )
}
