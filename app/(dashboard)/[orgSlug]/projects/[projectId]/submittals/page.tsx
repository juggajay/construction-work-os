/**
 * Submittals List Page
 * Display all submittals for a project with filtering
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { SubmittalStatusBadge } from '@/components/submittals/submittal-status-badge';
import { SubmittalStageBadge } from '@/components/submittals/submittal-stage-badge';
import { formatDistanceToNow } from 'date-fns';

interface PageProps {
  params: Promise<{
    orgSlug: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    status?: string;
    stage?: string;
    spec?: string;
    overdue?: string;
  }>;
}

export default async function SubmittalsListPage({ params, searchParams }: PageProps) {
  const { orgSlug, projectId } = await params;
  const { status: statusFilter, stage: stageFilter, spec: specFilter, overdue: overdueFilter } = await searchParams;

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, org_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Build query with filters
  let query = supabase
    .from('submittals')
    .select(
      `
      id,
      number,
      title,
      submittal_type,
      spec_section,
      spec_section_title,
      status,
      current_stage,
      version,
      version_number,
      required_on_site,
      procurement_deadline,
      submitted_at,
      created_at,
      created_by,
      current_reviewer_id,
      submitted_by_org:organizations(id, name)
    `,
      { count: 'exact' }
    )
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Apply filters
  if (statusFilter) {
    query = query.eq('status', statusFilter as any);
  }

  if (stageFilter) {
    query = query.eq('current_stage', stageFilter as any);
  }

  if (specFilter) {
    // Partial match on spec section (e.g., "03" matches all Division 03)
    query = query.like('spec_section', `${specFilter}%`);
  }

  if (overdueFilter === 'true') {
    const today = new Date().toISOString().split('T')[0];
    query = query
      .not('procurement_deadline', 'is', null)
      .lt('procurement_deadline', today)
      .not('status', 'in', '(approved,approved_as_noted,rejected,cancelled)');
  }

  const { data: submittals, error: submittalsError, count } = await query;

  if (submittalsError) {
    console.error('Error fetching submittals:', submittalsError);
  }

  // Type assertion for complex nested query
  const submittalsList = (submittals || []) as any[];

  // Calculate stats
  const stats = {
    total: count || 0,
    draft: submittalsList.filter((s) => s.status === 'draft').length,
    inReview: submittalsList.filter((s) =>
      ['gc_review', 'ae_review', 'owner_review'].includes(s.current_stage)
    ).length,
    overdue: submittalsList.filter((s) => {
      if (!s.procurement_deadline) return false;
      const deadline = new Date(s.procurement_deadline);
      const today = new Date();
      const isOverdue = deadline < today;
      const isNotClosed = !['approved', 'approved_as_noted', 'rejected', 'cancelled'].includes(s.status);
      return isOverdue && isNotClosed;
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submittals</h1>
          <p className="text-muted-foreground">{(project as any).name}</p>
        </div>
        <Link href={`/${orgSlug}/projects/${projectId}/submittals/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Submittal
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Submittals</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.draft}</div>
          <div className="text-sm text-muted-foreground">Drafts</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.inReview}</div>
          <div className="text-sm text-muted-foreground">In Review</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
          <div className="text-sm text-muted-foreground">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm font-medium">Filters:</div>
        <Link
          href={`/${orgSlug}/projects/${projectId}/submittals`}
          className={!statusFilter && !stageFilter && !specFilter && !overdueFilter ? 'font-bold' : ''}
        >
          <Button variant={!statusFilter && !stageFilter && !specFilter && !overdueFilter ? 'default' : 'outline'} size="sm">
            All
          </Button>
        </Link>
        <Link href={`/${orgSlug}/projects/${projectId}/submittals?overdue=true`}>
          <Button variant={overdueFilter === 'true' ? 'default' : 'outline'} size="sm">
            Overdue
          </Button>
        </Link>
        <Link href={`/${orgSlug}/projects/${projectId}/submittals?status=draft`}>
          <Button variant={statusFilter === 'draft' ? 'default' : 'outline'} size="sm">
            Draft
          </Button>
        </Link>
        <Link href={`/${orgSlug}/projects/${projectId}/submittals?stage=gc_review`}>
          <Button variant={stageFilter === 'gc_review' ? 'default' : 'outline'} size="sm">
            GC Review
          </Button>
        </Link>
        <Link href={`/${orgSlug}/projects/${projectId}/submittals?stage=ae_review`}>
          <Button variant={stageFilter === 'ae_review' ? 'default' : 'outline'} size="sm">
            A/E Review
          </Button>
        </Link>
      </div>

      {/* Submittals List */}
      {submittalsList.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No submittals found</p>
          <Link href={`/${orgSlug}/projects/${projectId}/submittals/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create First Submittal
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Number</th>
                  <th className="text-left p-4 font-medium">Title</th>
                  <th className="text-left p-4 font-medium">CSI Section</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Stage</th>
                  <th className="text-left p-4 font-medium">Version</th>
                  <th className="text-left p-4 font-medium">Deadline</th>
                  <th className="text-left p-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {submittalsList.map((submittal) => {
                  const isOverdue =
                    submittal.procurement_deadline &&
                    new Date(submittal.procurement_deadline) < new Date() &&
                    !['approved', 'approved_as_noted', 'rejected', 'cancelled'].includes(submittal.status);

                  return (
                    <tr key={submittal.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <Link
                          href={`/${orgSlug}/projects/${projectId}/submittals/${submittal.id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {submittal.number}
                        </Link>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/${orgSlug}/projects/${projectId}/submittals/${submittal.id}`}
                          className="hover:underline"
                        >
                          <div className="font-medium">{submittal.title}</div>
                          {submittal.submitted_by_org && (
                            <div className="text-sm text-muted-foreground">
                              {submittal.submitted_by_org.name}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-sm">{submittal.spec_section}</div>
                        {submittal.spec_section_title && (
                          <div className="text-xs text-muted-foreground">{submittal.spec_section_title}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <SubmittalStatusBadge status={submittal.status} />
                      </td>
                      <td className="p-4">
                        <SubmittalStageBadge stage={submittal.current_stage} />
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm">{submittal.version}</span>
                      </td>
                      <td className="p-4">
                        {submittal.procurement_deadline ? (
                          <div className={isOverdue ? 'text-orange-600 font-medium' : ''}>
                            <div className="text-sm flex items-center gap-1">
                              {isOverdue && <AlertCircle className="h-3 w-3" />}
                              {new Date(submittal.procurement_deadline).toLocaleDateString()}
                            </div>
                            {submittal.required_on_site && (
                              <div className="text-xs text-muted-foreground">
                                Need: {new Date(submittal.required_on_site).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(submittal.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
