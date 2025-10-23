import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { getOrganizationProjects } from '@/lib/actions/project-helpers'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, FolderOpen } from 'lucide-react'
import type { Organization, Project } from '@/lib/types'

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const orgResult = await getOrganizationBySlug(orgSlug)

  if (!orgResult) {
    redirect('/dashboard')
  }

  // After the redirect check, we know org is defined
  const org = orgResult as Organization
  const projects = (await getOrganizationProjects(org.id)) as Project[]

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{org.name}</h1>
          <p className="mt-1 text-neutral-600">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${orgSlug}/projects/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-neutral-400" />
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="mt-2 text-center text-sm text-neutral-600">
              Get started by creating your first construction project
            </p>
            <Button className="mt-6" asChild>
              <Link href={`/${orgSlug}/projects/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/${orgSlug}/projects/${project.id}`}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                      {project.number && (
                        <CardDescription className="mt-1">
                          {project.number}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary">{project.status || 'planning'}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.address && (
                    <p className="line-clamp-2 text-sm text-neutral-600">
                      {project.address}
                    </p>
                  )}
                  {project.budget && (
                    <p className="mt-2 text-sm font-medium">
                      Budget: ${Number(project.budget).toFixed(2)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
