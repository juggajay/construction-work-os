import { getProjectDetail } from '@/lib/actions/project-health'
import { InvoiceList } from '@/components/project-health/invoice-list'
import { DirectCostsList } from '@/components/project-health/direct-costs-list'
import { HealthIndicator } from '@/components/project-health/health-indicator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectId: string }>
}) {
  const { orgSlug, projectId } = await params
  const projectResult = await getProjectDetail(projectId)

  if (!projectResult.success || !projectResult.data) {
    redirect(`/${orgSlug}/project-health`)
  }

  const project = projectResult.data

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/${orgSlug}/project-health`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project Health
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="mt-2 text-neutral-600">Project Status: {project.status}</p>
          </div>
          <HealthIndicator status={project.healthStatus} percentSpent={project.percentSpent} size="lg" />
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${project.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              ${project.totalAllocated.toLocaleString()} allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${project.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-neutral-500 mt-1">{project.percentSpent.toFixed(1)}% of budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(project.budget - project.totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Available to spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Breakdown by Category */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Budget Breakdown by Category</CardTitle>
          <CardDescription>Track spending across different budget categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {project.categoryBreakdown.map((category) => (
            <div key={category.category}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium capitalize">{category.category}</p>
                  <p className="text-xs text-neutral-500">
                    ${category.spent.toLocaleString()} / ${category.allocated.toLocaleString()}
                  </p>
                </div>
                <div className="text-sm font-semibold">{category.percentSpent.toFixed(1)}% spent</div>
              </div>
              <Progress value={category.percentSpent} className="h-2" />
              <p className="text-xs text-neutral-500 mt-1">
                ${category.remaining.toLocaleString()} remaining
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invoices Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            {project.invoices.length} invoice{project.invoices.length !== 1 ? 's' : ''} uploaded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceList invoices={project.invoices} />
        </CardContent>
      </Card>

      {/* Direct Costs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Direct Costs</CardTitle>
          <CardDescription>
            {project.directCosts.length} direct cost{project.directCosts.length !== 1 ? 's' : ''} added (labor, equipment, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DirectCostsList directCosts={project.directCosts} />
        </CardContent>
      </Card>
    </div>
  )
}
