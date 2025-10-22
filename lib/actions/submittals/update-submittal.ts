'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { UpdateSubmittalSchema } from './schemas';
import { z } from 'zod';

export type UpdateSubmittalInput = z.infer<typeof UpdateSubmittalSchema>;

export interface UpdateSubmittalResult {
  success: boolean;
  data?: {
    id: string;
    updated: boolean;
  };
  error?: string;
}

/**
 * Update submittal details (draft status or by reviewer)
 * Permission check: creator can update drafts, reviewer can update assigned submittals
 */
export async function updateSubmittal(
  input: unknown
): Promise<UpdateSubmittalResult> {
  try {
    // Validate input
    const validated = UpdateSubmittalSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if submittal exists and get current state
    const { data: existingSubmittal, error: fetchError } = await supabase
      .from('submittals')
      .select('id, status, created_by, current_reviewer_id, project_id')
      .eq('id', validated.submittalId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingSubmittal) {
      return { success: false, error: 'Submittal not found' };
    }

    // Permission check via RLS (will be enforced by database)
    // But let's provide a clearer error message
    const canUpdate =
      existingSubmittal.status === 'draft' && existingSubmittal.created_by === user.id ||
      existingSubmittal.current_reviewer_id === user.id;

    if (!canUpdate) {
      return {
        success: false,
        error: 'Cannot modify submittal. Only creators can update drafts, and reviewers can update assigned submittals.',
      };
    }

    // Parse requiredOnSite date if provided
    let requiredOnSite: string | null | undefined = undefined;
    if (validated.requiredOnSite !== undefined) {
      if (validated.requiredOnSite) {
        const date = new Date(validated.requiredOnSite);
        if (isNaN(date.getTime())) {
          return { success: false, error: 'Invalid required on site date' };
        }
        requiredOnSite = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      } else {
        requiredOnSite = null;
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (requiredOnSite !== undefined) updateData.required_on_site = requiredOnSite;
    if (validated.leadTimeDays !== undefined) updateData.lead_time_days = validated.leadTimeDays;

    // Update submittal
    const { error: updateError } = await supabase
      .from('submittals')
      .update(updateData)
      .eq('id', validated.submittalId);

    if (updateError) {
      console.error('Error updating submittal:', updateError);
      return {
        success: false,
        error: 'Failed to update submittal',
      };
    }

    // Revalidate submittal detail page
    revalidatePath(`/[orgSlug]/projects/${existingSubmittal.project_id}/submittals/${validated.submittalId}`);
    revalidatePath(`/[orgSlug]/projects/${existingSubmittal.project_id}/submittals`);

    return {
      success: true,
      data: {
        id: validated.submittalId,
        updated: true,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Unexpected error updating submittal:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
