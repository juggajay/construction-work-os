/**
// ✅ PHASE 2 OPTIMIZATION: Page-level caching (10s revalidate)
export const revalidate = 10

 * Submittals Pipeline Page
 * Display submittals in a kanban-style pipeline view
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { SubmittalCards } from '@/components/submittals/submittal-cards';

interface PageProps {
  params: Promise<{
    orgSlug: string;
    projectId: string;
  }>;
}

// Define the 6 stages for the pipeline (matching design spec)
// We map database stages to these display stages
const PIPELINE_STAGES = [
  { id: 'draft' as const, title: 'Draft', dbStages: ['draft'] },
  { id: 'submitted' as const, title: 'Submitted', dbStages: ['gc_review'] },
  { id: 'under_review' as const, title: 'Under Review', dbStages: ['ae_review'] },
  { id: 'approved_with_comments' as const, title: 'Approved w/ Comments', dbStages: ['owner_review'] },
  { id: 'approved' as const, title: 'Approved', dbStages: ['complete'] },
  { id: 'rejected' as const, title: 'Rejected', dbStages: [] }, // Special case: filter by status
];

export default async function SubmittalsListPage({ params }: PageProps) {
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
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, org_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Get counts for each stage
  const { data: submittals } = await supabase
    .from('submittals')
    .select('current_stage, status')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  // Calculate counts for each pipeline stage
  const stageCounts = {
    draft: submittals?.filter((s) => s.current_stage === 'draft').length || 0,
    submitted: submittals?.filter((s) => s.current_stage === 'gc_review').length || 0,
    under_review: submittals?.filter((s) => s.current_stage === 'ae_review').length || 0,
    approved_with_comments: submittals?.filter((s) => s.current_stage === 'owner_review').length || 0,
    approved: submittals?.filter((s) => s.current_stage === 'complete').length || 0,
    rejected: submittals?.filter((s) => s.status === 'rejected').length || 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submittals</h1>
          <p className="text-muted-foreground">Track and manage all project submittals</p>
        </div>
        <Link href={`/${orgSlug}/projects/${projectId}/submittals/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Submittal
          </Button>
        </Link>
      </div>

      {/* Pipeline View */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.id} className="w-80">
              <div className="bg-muted/30 rounded-t-lg p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{stage.title}</h3>
                  <Badge variant="secondary">{stageCounts[stage.id]}</Badge>
                </div>
              </div>
              <div className="bg-card rounded-b-lg border border-t-0 min-h-[600px] p-2 space-y-2">
                <SubmittalCards projectId={projectId} orgSlug={orgSlug} stage={stage.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
