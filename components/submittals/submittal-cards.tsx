/**
 * SubmittalCards Component
 * Fetches and displays submittal cards for a specific stage in the pipeline
 */

import { createClient } from '@/lib/supabase/server';
import { SubmittalCard } from './submittal-card';

// Pipeline stage IDs (display stages)
type PipelineStage = 'draft' | 'submitted' | 'under_review' | 'approved_with_comments' | 'approved' | 'rejected';

// Database stage enum values
type ReviewStage = 'draft' | 'gc_review' | 'ae_review' | 'owner_review' | 'complete';

interface SubmittalCardsProps {
  projectId: string;
  orgSlug: string;
  stage: PipelineStage;
}

// Map pipeline stages to database stages
const stageMapping: Record<PipelineStage, ReviewStage | null> = {
  draft: 'draft',
  submitted: 'gc_review',
  under_review: 'ae_review',
  approved_with_comments: 'owner_review',
  approved: 'complete',
  rejected: null, // Special case: filter by status instead
};

export async function SubmittalCards({ projectId, orgSlug, stage }: SubmittalCardsProps) {
  const supabase = await createClient();

  const dbStage = stageMapping[stage];

  // Build query based on stage
  let query = supabase
    .from('submittals')
    .select(
      `
      id,
      number,
      title,
      project_id,
      spec_section,
      spec_section_title,
      submittal_type,
      procurement_deadline,
      current_stage,
      status,
      current_reviewer_id,
      project:projects!inner(id, name),
      reviewer:profiles(id, full_name, avatar_url)
    `
    )
    .eq('project_id', projectId)
    .is('deleted_at', null);

  // Filter by stage or status
  if (dbStage) {
    query = query.eq('current_stage', dbStage);
  } else if (stage === 'rejected') {
    // Special case: filter by rejected status
    query = query.eq('status', 'rejected');
  }

  const { data: submittals, error } = await query
    .order('procurement_deadline', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submittals:', error);
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Error loading submittals
      </div>
    );
  }

  if (!submittals || submittals.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No submittals
      </div>
    );
  }

  // Type assertion for complex nested query
  const submittalsList = submittals as any[];

  return (
    <>
      {submittalsList.map((submittal) => (
        <SubmittalCard
          key={submittal.id}
          submittal={{
            id: submittal.id,
            number: submittal.number,
            title: submittal.title,
            project_id: submittal.project_id,
            org_slug: orgSlug,
            project_name: submittal.project?.name || 'Unknown Project',
            spec_section: submittal.spec_section,
            spec_section_title: submittal.spec_section_title,
            submittal_type: submittal.submittal_type,
            procurement_deadline: submittal.procurement_deadline,
            current_reviewer: submittal.reviewer
              ? {
                  id: submittal.reviewer.id,
                  full_name: submittal.reviewer.full_name,
                  avatar_url: submittal.reviewer.avatar_url,
                }
              : null,
          }}
        />
      ))}
    </>
  );
}
