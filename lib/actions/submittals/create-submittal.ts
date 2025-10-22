'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { CreateSubmittalSchema } from './schemas';
import { z } from 'zod';

export type CreateSubmittalInput = z.infer<typeof CreateSubmittalSchema>;

export interface CreateSubmittalResult {
  success: boolean;
  data?: {
    id: string;
    number: string;
    version: string;
    status: string;
  };
  error?: string;
}

/**
 * Create a new submittal in draft status
 * Automatically generates sequential number per project and CSI spec section
 */
export async function createSubmittal(
  input: unknown
): Promise<CreateSubmittalResult> {
  try {
    // Validate input
    const validated = CreateSubmittalSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate next submittal number using database function
    const { data: numberData, error: numberError } = await supabase.rpc(
      'next_submittal_number',
      {
        p_project_id: validated.projectId,
        p_spec_section: validated.specSection,
      }
    );

    if (numberError || !numberData) {
      console.error('Error generating submittal number:', numberError);
      return {
        success: false,
        error: 'Failed to generate submittal number',
      };
    }

    const submittalNumber = numberData as string;

    // Parse requiredOnSite date if provided
    let requiredOnSite: string | null = null;
    if (validated.requiredOnSite) {
      const date = new Date(validated.requiredOnSite);
      if (isNaN(date.getTime())) {
        return { success: false, error: 'Invalid required on site date' };
      }
      requiredOnSite = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    // Insert submittal record
    const { data: submittal, error: insertError } = await supabase
      .from('submittals')
      .insert({
        project_id: validated.projectId,
        number: submittalNumber,
        title: validated.title,
        description: validated.description || null,
        submittal_type: validated.submittalType,
        spec_section: validated.specSection,
        spec_section_title: validated.specSectionTitle || null,
        status: 'draft',
        current_stage: 'draft',
        version: 'Rev 0',
        version_number: 0,
        created_by: user.id,
        submitted_by_org: validated.submittedByOrg || null,
        required_on_site: requiredOnSite,
        lead_time_days: validated.leadTimeDays || null,
      })
      .select('id, number, version, status')
      .single();

    if (insertError) {
      console.error('Error creating submittal:', insertError);
      return {
        success: false,
        error: 'Failed to create submittal',
      };
    }

    if (!submittal) {
      return {
        success: false,
        error: 'Submittal created but no data returned',
      };
    }

    // Revalidate project submittals page
    revalidatePath(`/[orgSlug]/projects/${validated.projectId}/submittals`);

    return {
      success: true,
      data: {
        id: submittal.id,
        number: submittal.number,
        version: submittal.version,
        status: submittal.status,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Unexpected error creating submittal:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
