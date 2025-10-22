'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SubmitForReviewSchema } from './schemas';
import { z } from 'zod';

export type SubmitForReviewInput = z.infer<typeof SubmitForReviewSchema>;

export interface SubmitForReviewResult {
  success: boolean;
  data?: {
    id: string;
    status: string;
    currentStage: string;
  };
  error?: string;
}

/**
 * Submit a draft submittal for initial GC review
 * Validates that attachments exist before allowing submission
 */
export async function submitForReview(
  input: unknown
): Promise<SubmitForReviewResult> {
  try {
    // Validate input
    const validated = SubmitForReviewSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get submittal and verify status
    const { data: submittal, error: fetchError } = await supabase
      .from('submittals')
      .select('id, status, created_by, project_id, version_number')
      .eq('id', validated.submittalId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !submittal) {
      return { success: false, error: 'Submittal not found' };
    }

    // Permission check: only creator can submit
    if (submittal.created_by !== user.id) {
      return {
        success: false,
        error: 'Only the creator can submit this submittal for review',
      };
    }

    // Status check: must be draft
    if (submittal.status !== 'draft') {
      return {
        success: false,
        error: 'Submittal must be in draft status to submit for review',
      };
    }

    // Validate that at least one attachment exists
    const { data: attachments, error: attachmentError } = await supabase
      .from('submittal_attachments')
      .select('id')
      .eq('submittal_id', validated.submittalId)
      .eq('version_number', submittal.version_number)
      .limit(1);

    if (attachmentError) {
      console.error('Error checking attachments:', attachmentError);
      return { success: false, error: 'Failed to verify attachments' };
    }

    if (!attachments || attachments.length === 0) {
      return {
        success: false,
        error: 'At least one attachment is required before submitting for review',
      };
    }

    // Update submittal status
    const { error: updateError } = await supabase
      .from('submittals')
      .update({
        status: 'submitted',
        current_stage: 'gc_review',
        current_reviewer_id: validated.reviewerId,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', validated.submittalId);

    if (updateError) {
      console.error('Error submitting submittal:', updateError);
      return { success: false, error: 'Failed to submit submittal for review' };
    }

    // TODO: Send email notification to reviewer
    // await sendSubmittalAssignedEmail(validated.submittalId, validated.reviewerId);

    // Revalidate pages
    revalidatePath(`/[orgSlug]/projects/${submittal.project_id}/submittals/${validated.submittalId}`);
    revalidatePath(`/[orgSlug]/projects/${submittal.project_id}/submittals`);

    return {
      success: true,
      data: {
        id: validated.submittalId,
        status: 'submitted',
        currentStage: 'gc_review',
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Unexpected error submitting submittal:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
