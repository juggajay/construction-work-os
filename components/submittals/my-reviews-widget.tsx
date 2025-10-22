/**
 * My Reviews Widget Component
 * Dashboard widget showing pending reviews assigned to current user
 */

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileText, Clock } from 'lucide-react';
import { SubmittalStageBadge } from './submittal-stage-badge';
import { formatDistanceToNow } from 'date-fns';

interface MyReviewsWidgetProps {
  orgSlug: string;
  limit?: number;
}

export async function MyReviewsWidget({ orgSlug, limit = 5 }: MyReviewsWidgetProps) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get pending reviews
  const { data: submittals } = (await supabase
    .from('submittals')
    .select(
      `
      id,
      number,
      title,
      current_stage,
      submitted_at,
      procurement_deadline,
      project:projects(id, name, org_id, organizations(slug))
    `
    )
    .eq('current_reviewer_id', user.id)
    .in('current_stage', ['gc_review', 'ae_review', 'owner_review'])
    .is('deleted_at', null)
    .order('submitted_at', { ascending: true })
    .limit(limit)) as any;

  const submittalsList = (submittals || []) as any[];

  if (submittalsList.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          My Pending Reviews
        </h2>
        <p className="text-sm text-muted-foreground">No reviews pending</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        My Pending Reviews ({submittalsList.length})
      </h2>

      <div className="space-y-3">
        {submittalsList.map((submittal: any) => {
          const orgSlugValue = submittal.project?.organizations?.slug || orgSlug;
          const isOverdue =
            submittal.procurement_deadline &&
            new Date(submittal.procurement_deadline) < new Date();

          return (
            <div
              key={submittal.id}
              className="flex items-start justify-between p-3 bg-muted rounded-lg hover:bg-muted/70 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/${orgSlugValue}/projects/${submittal.project.id}/submittals/${submittal.id}/review`}
                  className="hover:underline"
                >
                  <div className="font-mono text-sm font-medium mb-1">{submittal.number}</div>
                  <div className="text-sm truncate mb-2">{submittal.title}</div>
                </Link>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <SubmittalStageBadge stage={submittal.current_stage} />
                  {submittal.submitted_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(submittal.submitted_at), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  {isOverdue && (
                    <span className="text-orange-600 font-medium">OVERDUE</span>
                  )}
                </div>
              </div>
              <Link
                href={`/${orgSlugValue}/projects/${submittal.project.id}/submittals/${submittal.id}/review`}
              >
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
