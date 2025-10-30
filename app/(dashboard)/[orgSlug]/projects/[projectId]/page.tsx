import { getProjectById } from '@/lib/actions/project-helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConstructionBadge } from '@/components/ui/construction-badge'
import Link from 'next/link'
import {
  ArrowLeft,
  Share,
  Download,
  Edit,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Users,
  MapPin,
  Clock,
} from 'lucide-react'
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

  // Calculate metrics
  const budget = project.budget ? project.budget / 1000000 : 0
  const spent = budget * 0.65 // Sample data
  const completion = Math.floor(Math.random() * 100) // TODO: Replace with actual completion

  let daysRemaining = 0
  let duration = 0
  if (project.end_date && project.start_date) {
    const endDate = new Date(project.end_date)
    const startDate = new Date(project.start_date)
    const today = new Date()
    daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  }

  // Determine health status
  let health: 'on-track' | 'at-risk' | 'delayed' | 'completed' = 'on-track'
  if (project.status === 'archived') {
    health = 'completed'
  } else if (project.status === 'on_hold') {
    health = 'at-risk'
  } else if (daysRemaining < 0) {
    health = 'delayed'
  }

  const rfiCount = 0 // TODO: Fetch actual RFI count
  const teamSize = 0 // TODO: Fetch actual team size

  return (
    <div className="min-h-screen">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 border-b">
        <div className="container mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${orgSlug}/projects`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Link>
                </Button>
                <Badge variant="outline" className="capitalize">
                  {project.status || 'planning'}
                </Badge>
                <ConstructionBadge status={health}>{health}</ConstructionBadge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-muted-foreground">
                {project.number && `Project #${project.number}`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" asChild>
                <Link href={`/${orgSlug}/projects/${projectId}/settings`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Bar */}
      <div className="bg-card border-b">
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricItem
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              label="Budget"
              value={budget > 0 ? `$${budget.toFixed(1)}M` : 'Not set'}
            />
            <MetricItem
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              label="Spent"
              value={spent > 0 ? `$${spent.toFixed(1)}M` : '$0.0M'}
            />
            <MetricItem
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              label="Timeline"
              value={duration > 0 ? `${duration} months` : 'Not set'}
            />
            <MetricItem
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              label="Complete"
              value={`${completion}%`}
            />
            <MetricItem
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              label="RFIs"
              value={rfiCount.toString()}
              badge={rfiCount > 0 ? `${rfiCount} open` : undefined}
            />
            <MetricItem
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              label="Team"
              value={teamSize > 0 ? `${teamSize} members` : 'None'}
            />
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="flex-1">
        <div className="border-b">
          <div className="container mx-auto">
            <TabsList className="h-12 bg-transparent rounded-none border-0 p-0">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="rfis"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                RFIs
              </TabsTrigger>
              <TabsTrigger
                value="submittals"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Submittals
              </TabsTrigger>
              <TabsTrigger
                value="changes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Changes
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Schedule
              </TabsTrigger>
              <TabsTrigger
                value="budget"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Budget
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Team
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="container mx-auto p-6">
          <TabsContent value="overview" className="mt-0">
            <ProjectOverview project={project} orgSlug={orgSlug} projectId={projectId} />
          </TabsContent>

          <TabsContent value="rfis" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">RFI content will be displayed here</p>
              <Button asChild>
                <Link href={`/${orgSlug}/projects/${projectId}/rfis`}>View All RFIs</Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="submittals" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Submittal content will be displayed here</p>
              <Button asChild>
                <Link href={`/${orgSlug}/projects/${projectId}/submittals`}>
                  View All Submittals
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="changes" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Change orders content will be displayed here
              </p>
              <Button asChild>
                <Link href={`/${orgSlug}/projects/${projectId}/change-orders`}>
                  View All Change Orders
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Schedule content will be displayed here</p>
            </div>
          </TabsContent>

          <TabsContent value="budget" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Budget content will be displayed here</p>
              <Button asChild>
                <Link href={`/${orgSlug}/projects/${projectId}/costs`}>View Costs</Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Documents content will be displayed here</p>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Team content will be displayed here</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// MetricItem Component
function MetricItem({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode
  label: string
  value: string
  badge?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-lg font-bold">{value}</p>
      {badge && (
        <Badge variant="outline" className="text-xs">
          {badge}
        </Badge>
      )}
    </div>
  )
}

// ProjectOverview Component
function ProjectOverview({
  project,
  orgSlug,
  projectId,
}: {
  project: Project
  orgSlug: string
  projectId: string
}) {
  return (
    <div className="space-y-6">
      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">
                {project.address || 'No address set'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Timeline</p>
              <p className="text-sm text-muted-foreground">
                {project.start_date && project.end_date ? (
                  <>
                    {new Date(project.start_date).toLocaleDateString()} -{' '}
                    {new Date(project.end_date).toLocaleDateString()}
                  </>
                ) : (
                  'Not set'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Button variant="outline" className="h-24 flex-col" asChild>
              <Link href={`/${orgSlug}/projects/${projectId}/costs`}>
                <DollarSign className="mb-2 h-6 w-6" />
                <span>Costs</span>
              </Link>
            </Button>
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
                <Clock className="mb-2 h-6 w-6" />
                <span>Daily Reports</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
