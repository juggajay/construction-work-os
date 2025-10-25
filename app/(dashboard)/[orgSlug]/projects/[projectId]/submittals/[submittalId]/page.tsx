/**
 * Submittal Detail Page
 * View single submittal with full details, review history, and attachments
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Download, FileText, Clock } from 'lucide-react';
import { SubmittalStatusBadge } from '@/components/submittals/submittal-status-badge';
import { SubmittalStageBadge } from '@/components/submittals/submittal-stage-badge';
import { formatDistanceToNow } from 'date-fns';

interface PageProps {
  params: Promise<{
    orgSlug: string;
    projectId: string;
    submittalId: string;
  }>;
}

export default async function SubmittalDetailPage({ params }: PageProps) {
  const { orgSlug, projectId, submittalId } = await params;

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get submittal with all related data
  // TODO: Re-enable user data after verifying foreign keys in remote database
  const { data: submittal, error: submittalError } = (await supabase
    .from('submittals')
    .select(
      `
      *,
      project:projects(id, name, org_id),
      submitted_by_org:organizations(id, name)
    `
    )
    .eq('id', submittalId)
    .is('deleted_at', null)
    .single()) as any;

  if (submittalError) {
    console.error('Submittal fetch error:', submittalError);
  }

  if (submittalError || !submittal) {
    notFound();
  }

  // Type assertion for complex nested query
  const submittalData = submittal as any;

  // Verify project match
  if (submittalData.project_id !== projectId) {
    notFound();
  }

  // Get attachments for current version
  const { data: attachments } = (await supabase
    .from('submittal_attachments')
    .select('*')
    .eq('submittal_id', submittalId)
    .eq('version_number', submittalData.version_number)
    .order('created_at', { ascending: false })) as any;

  // Get review history
  // TODO: Re-enable user data after verifying foreign keys in remote database
  const { data: reviews } = (await supabase
    .from('submittal_reviews')
    .select('*')
    .eq('submittal_id', submittalId)
    .order('reviewed_at', { ascending: false })) as any;

  // Get version history
  // TODO: Re-enable user data after verifying foreign keys in remote database
  const { data: versions } = (await supabase
    .from('submittal_versions')
    .select('*')
    .eq('submittal_id', submittalId)
    .order('version_number', { ascending: false })) as any;

  const attachmentsList = (attachments || []) as any[];
  const reviewsList = (reviews || []) as any[];
  const versionsList = (versions || []) as any[];

  const isOverdue =
    submittalData.procurement_deadline &&
    new Date(submittalData.procurement_deadline) < new Date() &&
    !['approved', 'approved_as_noted', 'rejected', 'cancelled'].includes(submittalData.status);

  const canEdit =
    submittalData.status === 'draft' && submittalData.created_by === user.id;

  const canReview =
    submittalData.current_reviewer_id === user.id &&
    ['gc_review', 'ae_review', 'owner_review'].includes(submittalData.current_stage);

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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight font-mono">
                {submittalData.number}
              </h1>
              <SubmittalStatusBadge status={submittalData.status} />
              <SubmittalStageBadge stage={submittalData.current_stage} />
            </div>
            <p className="text-lg text-muted-foreground mt-1">{submittalData.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              href={`/${orgSlug}/projects/${projectId}/submittals/${submittalId}/edit`}
            >
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {canReview && (
            <Link
              href={`/${orgSlug}/projects/${projectId}/submittals/${submittalId}/review`}
            >
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Review
              </Button>
            </Link>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">CSI Spec Section</div>
          <div className="font-mono font-medium">{submittalData.spec_section}</div>
          {submittalData.spec_section_title && (
            <div className="text-sm text-muted-foreground mt-1">
              {submittalData.spec_section_title}
            </div>
          )}
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Submittal Type</div>
          <div className="font-medium capitalize">
            {submittalData.submittal_type.replace('_', ' ')}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Version</div>
          <div className="font-mono font-medium">{submittalData.version}</div>
          {submittalData.parent && (
            <div className="text-sm text-muted-foreground mt-1">
              Revised from{' '}
              <Link
                href={`/${orgSlug}/projects/${projectId}/submittals/${submittalData.parent.id}`}
                className="hover:underline"
              >
                {submittalData.parent.number} ({submittalData.parent.version})
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Deadlines & Dates */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {submittalData.required_on_site && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Required On Site</div>
              <div className={isOverdue ? 'text-orange-600 font-medium' : ''}>
                {new Date(submittalData.required_on_site).toLocaleDateString()}
              </div>
            </div>
          )}
          {submittalData.procurement_deadline && (
            <div>
              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Procurement Deadline
              </div>
              <div className={isOverdue ? 'text-orange-600 font-medium' : ''}>
                {new Date(submittalData.procurement_deadline).toLocaleDateString()}
                {isOverdue && <span className="ml-2 text-xs">(OVERDUE)</span>}
              </div>
            </div>
          )}
          {submittalData.lead_time_days !== null && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Lead Time</div>
              <div>{submittalData.lead_time_days} days</div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {submittalData.description && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <p className="text-sm whitespace-pre-wrap">{submittalData.description}</p>
        </div>
      )}

      {/* Attachments */}
      {attachmentsList.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Attachments ({attachmentsList.length})
          </h2>
          <div className="space-y-3">
            {attachmentsList.map((attachment: any) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{attachment.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {attachment.attachment_type.replace('_', ' ')} •{' '}
                      {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review History */}
      {reviewsList.length > 0 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Review History</h2>
          <div className="space-y-4">
            {reviewsList.map((review: any) => (
              <div key={review.id} className="border-l-4 border-muted pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {review.action.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(review.reviewed_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm mb-1">{review.comments}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version History */}
      {versionsList.length > 1 && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Version History</h2>
          <div className="space-y-3">
            {versionsList.map((version: any) => (
              <div
                key={version.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <div className="font-mono font-medium">{version.version}</div>
                  {version.notes && (
                    <div className="text-sm text-muted-foreground">{version.notes}</div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(version.uploaded_at), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="border rounded-lg p-6 text-sm text-muted-foreground">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="font-medium text-foreground mb-1">Created</div>
            <div>
              {formatDistanceToNow(new Date(submittalData.created_at), {
                addSuffix: true,
              })}
            </div>
          </div>
          {submittalData.submitted_at && (
            <div>
              <div className="font-medium text-foreground mb-1">Submitted</div>
              <div>
                {formatDistanceToNow(new Date(submittalData.submitted_at), {
                  addSuffix: true,
                })}
              </div>
              {submittalData.submitted_by_org && (
                <div>by {submittalData.submitted_by_org.name}</div>
              )}
            </div>
          )}
          {submittalData.reviewed_at && (
            <div>
              <div className="font-medium text-foreground mb-1">Last Reviewed</div>
              <div>
                {formatDistanceToNow(new Date(submittalData.reviewed_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
          )}
          {submittalData.closed_at && (
            <div>
              <div className="font-medium text-foreground mb-1">Closed</div>
              <div>
                {formatDistanceToNow(new Date(submittalData.closed_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
