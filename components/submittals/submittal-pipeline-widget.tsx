/**
 * Submittal Pipeline Widget Component
 * Dashboard widget showing submittal workflow stages and counts
 */

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface SubmittalPipelineWidgetProps {
  projectId: string;
  orgSlug: string;
}

export async function SubmittalPipelineWidget({
  projectId,
  orgSlug,
}: SubmittalPipelineWidgetProps) {
  const supabase = await createClient();

  // Get submittal counts by stage
  const { data: submittals } = (await supabase
    .from('submittals')
    .select('id, current_stage, status, procurement_deadline')
    .eq('project_id', projectId)
    .is('deleted_at', null)) as any;

  const submittalsList = (submittals || []) as any[];

  const stats = {
    draft: submittalsList.filter((s) => s.current_stage === 'draft').length,
    gcReview: submittalsList.filter((s) => s.current_stage === 'gc_review').length,
    aeReview: submittalsList.filter((s) => s.current_stage === 'ae_review').length,
    ownerReview: submittalsList.filter((s) => s.current_stage === 'owner_review').length,
    complete: submittalsList.filter((s) => s.current_stage === 'complete').length,
    overdue: submittalsList.filter((s) => {
      if (!s.procurement_deadline) return false;
      const deadline = new Date(s.procurement_deadline);
      const today = new Date();
      return (
        deadline < today &&
        !['approved', 'approved_as_noted', 'rejected', 'cancelled'].includes(s.status)
      );
    }).length,
  };

  const total = submittalsList.length;

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submittal Pipeline
        </h2>
        <Link href={`/${orgSlug}/projects/${projectId}/submittals`}>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </div>

      {/* Total Count */}
      <div className="mb-4">
        <div className="text-3xl font-bold">{total}</div>
        <div className="text-sm text-muted-foreground">Total Submittals</div>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-3">
        <Link
          href={`/${orgSlug}/projects/${projectId}/submittals?status=draft`}
          className="block"
        >
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Draft</span>
            </div>
            <span className="font-semibold">{stats.draft}</span>
          </div>
        </Link>

        <Link
          href={`/${orgSlug}/projects/${projectId}/submittals?stage=gc_review`}
          className="block"
        >
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">GC Review</span>
            </div>
            <span className="font-semibold">{stats.gcReview}</span>
          </div>
        </Link>

        <Link
          href={`/${orgSlug}/projects/${projectId}/submittals?stage=ae_review`}
          className="block"
        >
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">A/E Review</span>
            </div>
            <span className="font-semibold">{stats.aeReview}</span>
          </div>
        </Link>

        <Link
          href={`/${orgSlug}/projects/${projectId}/submittals?stage=owner_review`}
          className="block"
        >
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Owner Review</span>
            </div>
            <span className="font-semibold">{stats.ownerReview}</span>
          </div>
        </Link>

        <Link
          href={`/${orgSlug}/projects/${projectId}/submittals?stage=complete`}
          className="block"
        >
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Complete</span>
            </div>
            <span className="font-semibold">{stats.complete}</span>
          </div>
        </Link>

        {stats.overdue > 0 && (
          <Link
            href={`/${orgSlug}/projects/${projectId}/submittals?overdue=true`}
            className="block"
          >
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">Overdue</span>
              </div>
              <span className="font-semibold text-orange-600">{stats.overdue}</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
