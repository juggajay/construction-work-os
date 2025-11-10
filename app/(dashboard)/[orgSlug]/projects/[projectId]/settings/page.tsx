/**
 * ✅ PHASE 3B OPTIMIZATION: Dynamic import for BudgetAllocationForm
 * Heavy component (353 lines) + LineItemsTable (490 lines) only loaded when needed
 * Expected: ~40-50KB bundle reduction
 */

import dynamic from 'next/dynamic'
import { getProjectById } from '@/lib/actions/project-helpers'
// ✅ PHASE 2 OPTIMIZATION: Page-level caching (3600s revalidate)
export const revalidate = 3600

import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProjectSettingsForm } from '@/components/projects/project-settings-form'

const BudgetAllocationForm = dynamic(
  () => import('@/components/projects/budget-allocation-form').then((mod) => ({ default: mod.BudgetAllocationForm })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading budget allocation...</p>
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

  if (!projectResult) {
    redirect(`/${orgSlug}/projects`)
  }

  const project = projectResult as any

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/${orgSlug}/projects/${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Project Settings</h1>
        <p className="mt-2 text-neutral-600">
          Manage settings and details for {project.name}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Update the basic information about this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectSettingsForm orgSlug={orgSlug} project={project} />
          </CardContent>
        </Card>

        {project.budget && (
          <Card>
            <CardHeader>
              <CardTitle>Budget Allocations</CardTitle>
              <CardDescription>
                Allocate your project budget across labor, materials, equipment, and other categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetAllocationForm
                projectId={project.id}
                totalBudget={parseFloat(project.budget)}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
                <div>
                  <h3 className="font-semibold text-red-900">Delete Project</h3>
                  <p className="text-sm text-red-700">
                    Once deleted, this project and all its data will be permanently removed.
                  </p>
                </div>
                <Button variant="destructive" disabled>
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
