'use server';

import { createClient } from '@/lib/supabase/server';
import { GetSubmittalDetailSchema } from './schemas';
import { z } from 'zod';

export type GetSubmittalDetailInput = z.infer<typeof GetSubmittalDetailSchema>;

export interface SubmittalDetail {
  id: string;
  project_id: string;
  number: string;
  title: string;
  description: string | null;
  submittal_type: string;
  spec_section: string;
  spec_section_title: string | null;
  status: string;
  current_stage: string;
  version: string;
  version_number: number;
  parent_submittal_id: string | null;
  created_by: string;
  submitted_by_org: string | null;
  current_reviewer_id: string | null;
  submitted_at: string | null;
  required_on_site: string | null;
  lead_time_days: number | null;
  procurement_deadline: string | null;
  reviewed_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  attachments: any[];
  reviews: any[];
  versions: any[];
}

export interface GetSubmittalDetailResult {
  success: boolean;
  data?: SubmittalDetail;
  error?: string;
}

/**
 * Get complete submittal details including attachments, reviews, and version history
 */
export async function getSubmittalDetail(
  input: unknown
): Promise<GetSubmittalDetailResult> {
  try {
    // Validate input
    const validated = GetSubmittalDetailSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch submittal with related data
    const { data: submittal, error: fetchError } = (await supabase
      .from('submittals')
      .select('*')
      .eq('id', validated.submittalId)
      .is('deleted_at', null)
      .single()) as any;

    if (fetchError || !submittal) {
      return { success: false, error: 'Submittal not found' };
    }

    // Fetch attachments for current version
    const { data: attachments } = await supabase
      .from('submittal_attachments')
      .select('*')
      .eq('submittal_id', validated.submittalId)
      .eq('version_number', submittal.version_number)
      .order('created_at', { ascending: true });

    // Fetch review history
    const { data: reviews } = await supabase
      .from('submittal_reviews')
      .select('*')
      .eq('submittal_id', validated.submittalId)
      .order('reviewed_at', { ascending: true });

    // Fetch version history (if resubmittals exist)
    const { data: versions } = await supabase
      .from('submittal_versions')
      .select('*')
      .eq('submittal_id', validated.submittalId)
      .order('version_number', { ascending: true });

    return {
      success: true,
      data: {
        ...submittal,
        attachments: attachments || [],
        reviews: reviews || [],
        versions: versions || [],
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Unexpected error fetching submittal detail:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
