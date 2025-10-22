'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CreateResubmittalSchema } from './schemas';
import { z } from 'zod';

export type CreateResubmittalInput = z.infer<typeof CreateResubmittalSchema>;

export interface CreateResubmittalResult {
  success: boolean;
  data?: {
    id: string;
    number: string;
    version: string;
    versionNumber: number;
  };
  error?: string;
}

/**
 * Create a resubmittal (new version) after revision request
 * Increments version (Rev 0 → Rev A → Rev B, etc.)
 * Inherits metadata from parent submittal
 */
export async function createResubmittal(
  input: unknown
): Promise<CreateResubmittalResult> {
  try {
    // Validate input
    const validated = CreateResubmittalSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get parent submittal
    const { data: parent, error: fetchError } = (await supabase
      .from('submittals')
      .select('*')
      .eq('id', validated.parentSubmittalId)
      .is('deleted_at', null)
      .single()) as any;

    if (fetchError || !parent) {
      return { success: false, error: 'Parent submittal not found' };
    }

    // Type assertion for parent submittal data (until DB types are generated)
    const parentData = parent as any;

    // Permission check: only creator can create resubmittal
    if (parentData.created_by !== user.id) {
      return {
        success: false,
        error: 'Only the original creator can create a resubmittal',
      };
    }

    // Status check: parent must be in revision or rejected status
    if (parentData.status !== 'revise_resubmit' && parentData.status !== 'rejected') {
      return {
        success: false,
        error: 'Can only create resubmittal after revision request or rejection',
      };
    }

    // Calculate next version
    const nextVersionNumber = parentData.version_number + 1;
    let nextVersion: string;
    if (nextVersionNumber === 0) {
      nextVersion = 'Rev 0';
    } else if (nextVersionNumber === 1) {
      nextVersion = 'Rev A';
    } else {
      // Rev B, Rev C, etc.
      const letter = String.fromCharCode(64 + nextVersionNumber); // A=65, B=66, etc.
      nextVersion = `Rev ${letter}`;
    }

    // Create new submittal (resubmittal)
    const { data: newSubmittal, error: insertError } = (await supabase
      .from('submittals')
      .insert({
        // Inherit metadata from parent
        project_id: parentData.project_id,
        number: parentData.number, // Same number
        title: parentData.title,
        description: parentData.description,
        submittal_type: parentData.submittal_type,
        spec_section: parentData.spec_section,
        spec_section_title: parentData.spec_section_title,
        required_on_site: parentData.required_on_site,
        lead_time_days: parentData.lead_time_days,
        submitted_by_org: parentData.submitted_by_org,

        // New version fields
        version: nextVersion,
        version_number: nextVersionNumber,
        parent_submittal_id: parentData.id,

        // Reset workflow fields
        status: 'draft',
        current_stage: 'draft',
        current_reviewer_id: null,
        submitted_at: null,
        reviewed_at: null,
        closed_at: null,

        // User tracking
        created_by: user.id,
      } as any)
      .select('id, number, version, version_number')
      .single()) as any;

    if (insertError) {
      console.error('Error creating resubmittal:', insertError);
      return { success: false, error: 'Failed to create resubmittal' };
    }

    if (!newSubmittal) {
      return { success: false, error: 'Resubmittal created but no data returned' };
    }

    // Create version history record
    const { error: versionError } = (await supabase
      .from('submittal_versions')
      .insert({
        submittal_id: newSubmittal.id,
        version: nextVersion,
        version_number: nextVersionNumber,
        notes: validated.notes,
        uploaded_by: user.id,
        uploaded_at: new Date().toISOString(),
      } as any)) as any;

    if (versionError) {
      console.error('Error creating version record:', versionError);
      // Non-fatal, resubmittal already created
    }

    // Revalidate pages
    revalidatePath(`/[orgSlug]/projects/${parentData.project_id}/submittals`);
    revalidatePath(`/[orgSlug]/projects/${parentData.project_id}/submittals/${validated.parentSubmittalId}`);

    return {
      success: true,
      data: {
        id: newSubmittal.id,
        number: newSubmittal.number,
        version: newSubmittal.version,
        versionNumber: newSubmittal.version_number,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Unexpected error creating resubmittal:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
