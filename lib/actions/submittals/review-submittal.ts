'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ReviewSubmittalSchema } from './schemas';
import { z } from 'zod';

export type ReviewSubmittalInput = z.infer<typeof ReviewSubmittalSchema>;

export interface ReviewSubmittalResult {
  success: boolean;
  data?: {
    id: string;
    status: string;
    currentStage: string;
  };
  error?: string;
}

/**
 * Review a submittal with approval/rejection/forwarding actions
 * Implements state machine logic for multi-stage review workflow
 */
export async function reviewSubmittal(
  input: unknown
): Promise<ReviewSubmittalResult> {
  try {
    // Validate input
    const validated = ReviewSubmittalSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get submittal and verify current state
    const { data: submittal, error: fetchError } = await supabase
      .from('submittals')
      .select('id, status, current_stage, current_reviewer_id, project_id, version_number')
      .eq('id', validated.submittalId)
      .is('deleted_at', null)
      .single()) as any;

    if (fetchError || !submittal) {
      return { success: false, error: 'Submittal not found' };
    }

    // Permission check: must be current reviewer
    if (submittal.current_reviewer_id !== user.id) {
      return {
        success: false,
        error: 'You are not the assigned reviewer for this submittal',
      };
    }

    // Validate action-specific requirements
    if (validated.action === 'forwarded' && !validated.nextReviewerId) {
      return {
        success: false,
        error: 'Next reviewer is required for forwarding action',
      };
    }

    // Determine new status and stage based on action
    let newStatus: string;
    let newStage: string;
    let newReviewerId: string | null;
    let closedAt: string | null = null;

    switch (validated.action) {
      case 'approved':
        newStatus = 'approved';
        newStage = 'complete';
        newReviewerId = null;
        closedAt = new Date().toISOString();
        break;

      case 'approved_as_noted':
        newStatus = 'approved_as_noted';
        newStage = 'complete';
        newReviewerId = null;
        closedAt = new Date().toISOString();
        break;

      case 'revise_resubmit':
        newStatus = 'revise_resubmit';
        newStage = 'complete';
        newReviewerId = null;
        closedAt = new Date().toISOString();
        break;

      case 'rejected':
        newStatus = 'rejected';
        newStage = 'complete';
        newReviewerId = null;
        closedAt = new Date().toISOString();
        break;

      case 'forwarded':
        // Advance to next stage
        newStatus = 'submitted';
        if (submittal.current_stage === 'gc_review') {
          newStage = 'ae_review';
        } else if (submittal.current_stage === 'ae_review') {
          newStage = 'owner_review';
        } else {
          return {
            success: false,
            error: 'Cannot forward from current stage',
          };
        }
        newReviewerId = validated.nextReviewerId || null;
        break;

      default:
        return { success: false, error: 'Invalid review action' };
    }

    // Create review record
    const { error: reviewError } = await supabase
      .from('submittal_reviews')
      .insert({
        submittal_id: validated.submittalId,
        version_number: submittal.version_number,
        stage: submittal.current_stage,
        reviewer_id: user.id,
        action: validated.action,
        comments: validated.comments,
        reviewed_at: new Date().toISOString(),
      });

    if (reviewError) {
      console.error('Error creating review record:', reviewError);
      return { success: false, error: 'Failed to create review record' };
    }

    // Update submittal status
    const { error: updateError } = await supabase
      .from('submittals')
      .update({
        status: newStatus,
        current_stage: newStage,
        current_reviewer_id: newReviewerId,
        reviewed_at: new Date().toISOString(),
        ...(closedAt && { closed_at: closedAt }),
      })
      .eq('id', validated.submittalId);

    if (updateError) {
      console.error('Error updating submittal status:', updateError);
      return { success: false, error: 'Failed to update submittal status' };
    }

    // TODO: Send email notifications based on action
    // if (validated.action === 'approved') await sendApprovalEmail(...)
    // if (validated.action === 'revise_resubmit') await sendRevisionRequestEmail(...)
    // if (validated.action === 'forwarded') await sendForwardedEmail(...)

    // Revalidate pages
    revalidatePath(`/[orgSlug]/projects/${submittal.project_id}/submittals/${validated.submittalId}`);
    revalidatePath(`/[orgSlug]/projects/${submittal.project_id}/submittals`);

    return {
      success: true,
      data: {
        id: validated.submittalId,
        status: newStatus,
        currentStage: newStage,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Unexpected error reviewing submittal:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
