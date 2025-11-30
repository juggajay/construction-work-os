/**
 * New Project Page - Industrial Luxury Dark Theme
 */

import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeft, FolderPlus } from 'lucide-react'
import { ProjectForm } from './project-form'

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const orgResult = await getOrganizationBySlug(orgSlug)

  if (!orgResult) {
    redirect('/dashboard')
  }

  const org = orgResult as any

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="mb-8 max-w-2xl mx-auto">
        <Link
          href={`/${orgSlug}/projects`}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all mb-6",
            "text-white/60 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Projects</span>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <FolderPlus className="h-5 w-5 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create New Project</h1>
        </div>
        <p className="text-white/50">
          Set up a new construction project in <span className="text-white font-medium">{org.name}</span>
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <ProjectForm orgId={org.id} orgSlug={orgSlug} />
      </div>
    </div>
  )
}
