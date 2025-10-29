import { getProjectById } from '@/lib/actions/project-helpers'
import { getBudgetBreakdown } from '@/lib/actions/budgets'
import { getBurnRateForecast } from '@/lib/actions/budgets'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Plus } from 'lucide-react'
import { LineItemSearch } from '@/components/costs/line-item-search'

export default async function CostsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectId: string }>
}) {
  const { orgSlug, projectId } = await params
  const projectResult = await getProjectById(projectId)

  if (!projectResult) {
    redirect(`/${orgSlug}`)
  }

  const project = projectResult as any

  // Fetch budget breakdown
  const budgetResult = await getBudgetBreakdown({ projectId })
  const budgetBreakdown = budgetResult.success ? budgetResult.data : []

  // Fetch burn rate forecast
  const forecastResult = await getBurnRateForecast(projectId)
  const forecast = forecastResult.success ? forecastResult.data : null

  // Calculate totals
  const totalBudget = project.budget || 0 // Original project budget from creation
  const totalAllocated = budgetBreakdown.reduce((sum, item) => sum + item.allocated, 0)
  const totalSpent = budgetBreakdown.reduce((sum, item) => sum + item.spent, 0)
  const totalRemaining = totalBudget - totalSpent // Remaining from original budget

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Tracking</h1>
          <p className="mt-2 text-neutral-600">{project.name}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/${orgSlug}/projects/${projectId}/costs/add-cost`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Cost
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/projects/${projectId}/costs/upload-invoice`}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {totalAllocated > 0 ? `$${totalAllocated.toLocaleString()} allocated` : 'Set in project creation'}
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
              ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Available to spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Burn Rate Forecast */}
      {forecast && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Burn Rate Forecast</CardTitle>
                <CardDescription>Project spending trajectory</CardDescription>
              </div>
              <Badge
                variant={
                  forecast.status === 'on_track'
                    ? 'default'
                    : forecast.status === 'warning'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {forecast.status === 'on_track' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {forecast.status !== 'on_track' && <AlertTriangle className="mr-1 h-3 w-3" />}
                {forecast.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-neutral-500">Daily Burn Rate</p>
                <p className="text-2xl font-bold">
                  ${forecast.dailyBurnRate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Forecasted Total</p>
                <p className="text-2xl font-bold">
                  ${forecast.forecastedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Days Elapsed</p>
                <p className="text-2xl font-bold">
                  {forecast.daysElapsed} / {forecast.daysTotal}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Forecasted Overrun</p>
                <p className={`text-2xl font-bold ${forecast.forecastedOverrun > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {forecast.forecastedOverrun > 0 ? '+' : ''}
                  ${forecast.forecastedOverrun.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Breakdown by Category</CardTitle>
          <CardDescription>Track spending across labor, materials, equipment, and other</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetBreakdown.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No budget allocations yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgetBreakdown.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{item.category}</span>
                      <Badge variant="outline">
                        {item.percentSpent.toFixed(1)}% spent
                      </Badge>
                    </div>
                    <div className="text-sm text-neutral-600">
                      ${item.spent.toLocaleString()} / ${item.allocated.toLocaleString()}
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.percentSpent > 90
                          ? 'bg-red-500'
                          : item.percentSpent > 75
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(item.percentSpent, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500">
                    ${item.remaining.toLocaleString()} remaining
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Item Search */}
      <LineItemSearch projectId={projectId} />
    </div>
  )
}
