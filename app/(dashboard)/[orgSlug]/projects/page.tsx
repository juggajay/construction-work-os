import { getOrganizationBySlug } from '@/lib/actions/organization-helpers'
import { getOrganizationProjects } from '@/lib/actions/project-helpers'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Building2, Calendar, MapPin } from 'lucide-react'

interface ProjectsPageProps {
  params: Promise<{
    orgSlug: string
  }>
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { orgSlug } = await params

  const org = await getOrganizationBySlug(orgSlug)

  if (!org) {
    notFound()
  }

  const projects = await getOrganizationProjects((org as any).id)

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-neutral-600">
            Manage all projects for {(org as any).name}
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
        <Card>
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-neutral-400" />
            <h2 className="mb-2 text-xl font-semibold">No projects yet</h2>
            <p className="mb-6 text-center text-neutral-600">
              Get started by creating your first project
            </p>
            <Button asChild>
              <Link href={`/${orgSlug}/projects/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/${orgSlug}/projects/${project.id}`}
              className="transition-transform hover:scale-[1.02]"
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <Badge variant="secondary">
                      {project.status || 'planning'}
                    </Badge>
                  </div>
                  {project.number && (
                    <p className="text-sm text-neutral-600">
                      Project #{project.number}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-neutral-500 flex-shrink-0" />
                      <span className="text-sm text-neutral-600">
                        {project.address}
                      </span>
                    </div>
                  )}
                  {project.start_date && project.end_date && (
                    <div className="flex items-start space-x-2">
                      <Calendar className="mt-0.5 h-4 w-4 text-neutral-500 flex-shrink-0" />
                      <span className="text-sm text-neutral-600">
                        {new Date(project.start_date).toLocaleDateString()} -{' '}
                        {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {project.description && (
                    <p className="text-sm text-neutral-600 line-clamp-2">
                      {project.description}
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
