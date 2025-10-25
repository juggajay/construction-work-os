/**
 * Submittal Review Page
 * Review and take action on a submittal
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ReviewActionPanel } from '@/components/submittals/review-action-panel';
import { SubmittalStatusBadge } from '@/components/submittals/submittal-status-badge';
import { SubmittalStageBadge } from '@/components/submittals/submittal-stage-badge';

interface PageProps {
  params: Promise<{
    orgSlug: string;
    projectId: string;
    submittalId: string;
  }>;
}

export default async function SubmittalReviewPage({ params }: PageProps) {
  const { orgSlug, projectId, submittalId } = await params;

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get submittal details
  const { data: submittal, error: submittalError } = (await supabase
    .from('submittals')
    .select(
      `
      *,
      project:projects(id, name),
      submitted_by_org:organizations(id, name)
    `
    )
    .eq('id', submittalId)
    .is('deleted_at', null)
    .single()) as any;

  if (submittalError || !submittal) {
    notFound();
  }

  const submittalData = submittal as any;

  // Verify project match
  if (submittalData.project_id !== projectId) {
    notFound();
  }

  // Permission check: must be current reviewer
  if (submittalData.current_reviewer_id !== user.id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/${orgSlug}/projects/${projectId}/submittals/${submittalId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Unauthorized</h1>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-muted-foreground">
            You are not the current reviewer for this submittal.
          </p>
        </div>
      </div>
    );
  }

  // Get potential reviewers for forwarding (project team members)
  const { data: projectUsers } = (await (supabase as any)
    .from('project_team_members')
    .select('user:users(id, full_name)')
    .eq('project_id', projectId)) as any;

  const availableReviewers =
    projectUsers?.map((pm: any) => pm.user).filter((u: any) => u.id !== user.id) || [];

  // Get recent attachments
  const { data: attachments } = (await supabase
    .from('submittal_attachments')
    .select('id, file_name, attachment_type, file_size')
    .eq('submittal_id', submittalId)
    .eq('version_number', submittalData.version_number)
    .order('created_at', { ascending: false })
    .limit(5)) as any;

  const attachmentsList = (attachments || []) as any[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${orgSlug}/projects/${projectId}/submittals/${submittalId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Submittal</h1>
          <p className="text-muted-foreground">{submittalData.project.name}</p>
        </div>
      </div>

      {/* Submittal Summary */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold font-mono">{submittalData.number}</h2>
              <SubmittalStatusBadge status={submittalData.status} />
              <SubmittalStageBadge stage={submittalData.current_stage} />
            </div>
            <p className="text-lg mb-1">{submittalData.title}</p>
            {submittalData.description && (
              <p className="text-sm text-muted-foreground">{submittalData.description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground mb-1">CSI Spec Section</div>
            <div className="font-mono">{submittalData.spec_section}</div>
            {submittalData.spec_section_title && (
              <div className="text-sm text-muted-foreground">
                {submittalData.spec_section_title}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Type</div>
            <div className="capitalize">{submittalData.submittal_type.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Version</div>
            <div className="font-mono">{submittalData.version}</div>
          </div>
        </div>

        {attachmentsList.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-2">
              Attachments ({attachmentsList.length})
            </div>
            <div className="space-y-1">
              {attachmentsList.map((att: any) => (
                <div key={att.id} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>•</span>
                  <span>{att.file_name}</span>
                  <span className="text-xs">
                    ({(att.file_size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Action Panel */}
      <ReviewActionPanel
        submittalId={submittalId}
        currentStage={submittalData.current_stage}
        orgSlug={orgSlug}
        projectId={projectId}
        availableReviewers={availableReviewers}
      />
    </div>
  );
}
