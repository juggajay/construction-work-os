import { getProjectById } from '@/lib/actions/project-helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, DollarSign, MapPin, FileText } from 'lucide-react'
import type { Project } from '@/lib/types'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectId: string }>
}) {
  const { orgSlug, projectId } = await params
  const projectResult = await getProjectById(projectId)

  if (!projectResult) {
    redirect(`/${orgSlug}`)
  }

  const project = projectResult as Project

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge variant="secondary">{project.status || 'planning'}</Badge>
            </div>
            {project.number && (
              <p className="mt-2 text-neutral-600">Project #{project.number}</p>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/projects/${projectId}/settings`}>
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {project.address || 'No address set'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            <Calendar className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {project.start_date && project.end_date ? (
                <>
                  {new Date(project.start_date).toLocaleDateString()} -{' '}
                  {new Date(project.end_date).toLocaleDateString()}
                </>
              ) : (
                'Not set'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Project Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-24 flex-col" asChild>
                <Link href={`/${orgSlug}/projects/${projectId}/rfis`}>
                  <FileText className="mb-2 h-6 w-6" />
                  <span>RFIs</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col" asChild>
                <Link href={`/${orgSlug}/projects/${projectId}/submittals`}>
                  <FileText className="mb-2 h-6 w-6" />
                  <span>Submittals</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col" asChild>
                <Link href={`/${orgSlug}/projects/${projectId}/change-orders`}>
                  <FileText className="mb-2 h-6 w-6" />
                  <span>Change Orders</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col" asChild>
                <Link href={`/${orgSlug}/projects/${projectId}/daily-reports`}>
                  <FileText className="mb-2 h-6 w-6" />
                  <span>Daily Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
