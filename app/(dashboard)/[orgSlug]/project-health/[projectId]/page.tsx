/**
 * Project Health Detail Page - Industrial Luxury Dark Theme
 */

import { getProjectDetail } from '@/lib/actions/project-health'
import { InvoiceList } from '@/components/project-health/invoice-list'
import { DirectCostsList } from '@/components/project-health/direct-costs-list'
import { HealthIndicator } from '@/components/project-health/health-indicator'
import { cn } from '@/lib/utils'
import { ArrowLeft, DollarSign, TrendingUp, Wallet, FileText, Receipt, BarChart3 } from 'lucide-react'
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
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${orgSlug}/project-health`}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all mb-6",
            "text-white/60 hover:text-white hover:bg-white/[0.05]"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Project Health</span>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
            <p className="text-white/50">
              Project Status: <span className="text-white/70 capitalize">{project.status}</span>
            </p>
          </div>
          <HealthIndicator status={project.healthStatus} percentSpent={project.percentSpent} size="lg" />
        </div>
      </div>

      {/* Budget Summary Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {/* Total Budget */}
        <div className={cn(
          "rounded-xl p-5",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/60">Total Budget</span>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            ${project.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-white/40">
            ${project.totalAllocated.toLocaleString()} allocated
          </p>
        </div>

        {/* Total Spent */}
        <div className={cn(
          "rounded-xl p-5",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/60">Total Spent</span>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            ${project.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-white/40">{project.percentSpent.toFixed(1)}% of budget</p>
        </div>

        {/* Remaining */}
        <div className={cn(
          "rounded-xl p-5",
          "bg-white/[0.02] border border-white/[0.06]"
        )}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/60">Remaining</span>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Wallet className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            ${(project.budget - project.totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-white/40">Available to spend</p>
        </div>
      </div>

      {/* Budget Breakdown by Category */}
      <div className={cn(
        "rounded-xl p-6 mb-8",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <BarChart3 className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Budget Breakdown by Category</h2>
            <p className="text-sm text-white/40">Track spending across different budget categories</p>
          </div>
        </div>

        <div className="space-y-6">
          {project.categoryBreakdown.map((category) => {
            const percentSpent = category.percentSpent
            const isOverBudget = percentSpent > 100
            const isWarning = percentSpent > 80 && percentSpent <= 100

            return (
              <div key={category.category}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-white capitalize">{category.category}</p>
                    <p className="text-xs text-white/40">
                      ${category.spent.toLocaleString()} / ${category.allocated.toLocaleString()}
                    </p>
                  </div>
                  <div className={cn(
                    "text-sm font-semibold",
                    isOverBudget ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {percentSpent.toFixed(1)}% spent
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isOverBudget
                        ? "bg-gradient-to-r from-red-500 to-red-600"
                        : isWarning
                        ? "bg-gradient-to-r from-amber-500 to-amber-600"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-600"
                    )}
                    style={{ width: `${Math.min(percentSpent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-white/40 mt-1">
                  ${category.remaining.toLocaleString()} remaining
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invoices Section */}
      <div className={cn(
        "rounded-xl p-6 mb-8",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Invoices</h2>
            <p className="text-sm text-white/40">
              {project.invoices.length} invoice{project.invoices.length !== 1 ? 's' : ''} uploaded
            </p>
          </div>
        </div>
        <InvoiceList invoices={project.invoices} />
      </div>

      {/* Direct Costs Section */}
      <div className={cn(
        "rounded-xl p-6",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Receipt className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Direct Costs</h2>
            <p className="text-sm text-white/40">
              {project.directCosts.length} direct cost{project.directCosts.length !== 1 ? 's' : ''} added (labor, equipment, etc.)
            </p>
          </div>
        </div>
        <DirectCostsList directCosts={project.directCosts} />
      </div>
    </div>
  )
}
