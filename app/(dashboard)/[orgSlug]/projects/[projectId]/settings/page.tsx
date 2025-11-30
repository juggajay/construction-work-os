/**
 * Project Settings Page - Industrial Luxury Dark Theme
 */

import dynamic from 'next/dynamic'
import { getProjectById } from '@/lib/actions/project-helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeft, Settings, DollarSign, AlertTriangle, Building2 } from 'lucide-react'
import { ProjectSettingsForm } from '@/components/projects/project-settings-form'

export const revalidate = 3600

const BudgetAllocationForm = dynamic(
  () => import('@/components/projects/budget-allocation-form').then((mod) => ({ default: mod.BudgetAllocationForm })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-sm text-white/40">Loading budget allocation...</p>
        </div>
      </div>
    ),
  }
)

interface ProjectSettingsPageProps {
  params: Promise<{
    orgSlug: string
    projectId: string
  }>
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { orgSlug, projectId } = await params

  const projectResult = await getProjectById(projectId)

  if (!projectResult || !projectResult.success) {
    redirect(`/${orgSlug}/projects`)
  }

  const project = projectResult.data.project as any

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${orgSlug}/projects/${projectId}`}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all mb-6",
            "text-white/60 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Project</span>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Settings className="h-5 w-5 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Project Settings</h1>
        </div>
        <p className="text-white/50">
          Manage settings and details for <span className="text-white font-medium">{project.name}</span>
        </p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Project Details Card */}
        <div className={cn(
          "rounded-xl p-6",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Building2 className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Project Details</h2>
              <p className="text-sm text-white/40">Update the basic information about this project</p>
            </div>
          </div>
          <ProjectSettingsForm orgSlug={orgSlug} project={project} />
        </div>

        {/* Budget Allocations Card */}
        {project.budget && (
          <div className={cn(
            "rounded-xl p-6",
            "bg-white/[0.02] border border-white/[0.06]"
          )}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Budget Allocations</h2>
                <p className="text-sm text-white/40">Allocate your project budget across labor, materials, equipment, and other categories</p>
              </div>
            </div>
            <BudgetAllocationForm
              projectId={project.id}
              totalBudget={parseFloat(project.budget)}
            />
          </div>
        )}

        {/* Danger Zone Card */}
        <div className={cn(
          "rounded-xl p-6",
          "bg-red-500/5 border border-red-500/20"
        )}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
              <p className="text-sm text-white/40">Irreversible and destructive actions</p>
            </div>
          </div>

          <div className={cn(
            "flex items-center justify-between rounded-lg p-4",
            "bg-red-500/10 border border-red-500/20"
          )}>
            <div>
              <h3 className="font-semibold text-red-400">Delete Project</h3>
              <p className="text-sm text-red-400/70">
                Once deleted, this project and all its data will be permanently removed.
              </p>
            </div>
            <button
              disabled
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm transition-all",
                "bg-red-500/20 text-red-400 border border-red-500/30",
                "opacity-50 cursor-not-allowed"
              )}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
