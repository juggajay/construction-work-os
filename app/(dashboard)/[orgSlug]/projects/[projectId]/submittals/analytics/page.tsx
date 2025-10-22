/**
 * Submittal Analytics Dashboard Page
 * Business intelligence and reporting for submittals
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getSubmittalPipelineStats,
  getAverageCycleTimes,
  getResubmittalRate,
  getCycleTimesByDivision,
  getOverdueSubmittals,
} from '@/lib/actions/submittals/analytics';

interface PageProps {
  params: Promise<{
    orgSlug: string;
    projectId: string;
  }>;
}

export default async function SubmittalAnalyticsPage({ params }: PageProps) {
  const { orgSlug, projectId } = await params;

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get project details
  const { data: project, error: projectError } = (await supabase
    .from('projects')
    .select('id, name, org_id')
    .eq('id', projectId)
    .single()) as any;

  if (projectError || !project) {
    notFound();
  }

  const projectData = project as any;

  // Fetch analytics data in parallel
  const [pipelineStats, cycleTimeStats, resubmittalStats, divisionCycleTimes, overdueSubmittals] =
    await Promise.all([
      getSubmittalPipelineStats(projectId),
      getAverageCycleTimes(projectId),
      getResubmittalRate(projectId),
      getCycleTimesByDivision(projectId),
      getOverdueSubmittals(projectId),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${orgSlug}/projects/${projectId}/submittals`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Submittal Analytics</h1>
            <p className="text-muted-foreground">{projectData.name}</p>
          </div>
        </div>
        <Button variant="outline">
          <TrendingUp className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Total Submittals</div>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">{pipelineStats?.total || 0}</div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Avg. Cycle Time</div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">{cycleTimeStats?.avgDaysToApproval || 0}</div>
          <div className="text-xs text-muted-foreground">days to approval</div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Resubmittal Rate</div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold">{resubmittalStats?.resubmittalRate || 0}%</div>
          <div className="text-xs text-muted-foreground">
            {resubmittalStats?.resubmitted || 0} of {resubmittalStats?.totalSubmittals || 0}
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Overdue</div>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {overdueSubmittals.length}
          </div>
          <div className="text-xs text-muted-foreground">past procurement deadline</div>
        </div>
      </div>

      {/* Pipeline Status */}
      {pipelineStats && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Pipeline Status</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{pipelineStats.draft}</div>
              <div className="text-sm text-muted-foreground">Draft</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1 text-blue-600">
                {pipelineStats.gcReview}
              </div>
              <div className="text-sm text-muted-foreground">GC Review</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1 text-blue-600">
                {pipelineStats.aeReview}
              </div>
              <div className="text-sm text-muted-foreground">A/E Review</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1 text-blue-600">
                {pipelineStats.ownerReview}
              </div>
              <div className="text-sm text-muted-foreground">Owner Review</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1 text-green-600">
                {pipelineStats.complete}
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Times by Division */}
      {divisionCycleTimes.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Avg. Approval Time by CSI Division</h2>
          <div className="space-y-3">
            {divisionCycleTimes.map((division) => (
              <div key={division.division} className="flex items-center gap-4">
                <div className="w-32 text-sm">
                  <div className="font-medium">{division.division}</div>
                  <div className="text-xs text-muted-foreground">{division.divisionTitle}</div>
                </div>
                <div className="flex-1">
                  <div className="h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-blue-500 flex items-center justify-end px-2"
                      style={{
                        width: `${Math.min((division.avgDays / 30) * 100, 100)}%`,
                      }}
                    >
                      <span className="text-xs text-white font-medium">
                        {division.avgDays} days
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-16 text-sm text-muted-foreground text-right">
                  {division.count} total
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Submittals */}
      {overdueSubmittals.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Overdue Submittals
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Number</th>
                  <th className="text-left p-3 text-sm font-medium">Title</th>
                  <th className="text-left p-3 text-sm font-medium">CSI</th>
                  <th className="text-left p-3 text-sm font-medium">Deadline</th>
                  <th className="text-left p-3 text-sm font-medium">Days Overdue</th>
                  <th className="text-left p-3 text-sm font-medium">Stage</th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {overdueSubmittals.map((submittal) => (
                  <tr key={submittal.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <Link
                        href={`/${orgSlug}/projects/${projectId}/submittals/${submittal.id}`}
                        className="font-mono text-sm hover:underline"
                      >
                        {submittal.number}
                      </Link>
                    </td>
                    <td className="p-3 text-sm">{submittal.title}</td>
                    <td className="p-3 text-sm font-mono">{submittal.specSection}</td>
                    <td className="p-3 text-sm">
                      {new Date(submittal.procurementDeadline).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium text-orange-600">
                        {submittal.daysOverdue} days
                      </span>
                    </td>
                    <td className="p-3 text-sm capitalize">
                      {submittal.currentStage.replace('_', ' ')}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/${orgSlug}/projects/${projectId}/submittals/${submittal.id}`}
                      >
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {pipelineStats?.total === 0 && (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No submittal data available yet. Create submittals to see analytics.
          </p>
          <Link href={`/${orgSlug}/projects/${projectId}/submittals/new`}>
            <Button>Create First Submittal</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
