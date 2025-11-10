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

    // ✅ OPTIMIZATION: Fetch submittal with all related data in ONE query
    // Previously: 4 sequential queries (submittal + attachments + reviews + versions)
    // Now: 1 query with nested selects
    // Expected improvement: 3-4x faster (400ms → 100ms)

    const { data: submittal, error: fetchError } = (await supabase
      .from('submittals')
      .select(`
        *,
        attachments:submittal_attachments!submittal_id(
          id,
          file_name,
          file_path,
          file_size,
          file_type,
          mime_type,
          version_number,
          uploaded_by,
          created_at,
          updated_at
        ),
        reviews:submittal_reviews!submittal_id(
          id,
          reviewer_id,
          review_status,
          review_comments,
          decision,
          reviewed_at,
          created_at,
          updated_at
        ),
        versions:submittal_versions!submittal_id(
          id,
          version_number,
          version,
          description,
          changes,
          created_by,
          created_at
        )
      `)
      .eq('id', validated.submittalId)
      .is('deleted_at', null)
      .single()) as any;

    if (fetchError || !submittal) {
      return { success: false, error: 'Submittal not found' };
    }

    // Filter attachments by current version_number (Supabase doesn't support nested .eq())
    const currentVersionAttachments = (submittal.attachments || [])
      .filter((att: any) => att.version_number === submittal.version_number)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Sort reviews by reviewed_at
    const sortedReviews = (submittal.reviews || [])
      .sort((a: any, b: any) => {
        if (!a.reviewed_at) return 1;
        if (!b.reviewed_at) return -1;
        return new Date(a.reviewed_at).getTime() - new Date(b.reviewed_at).getTime();
      });

    // Sort versions by version_number
    const sortedVersions = (submittal.versions || [])
      .sort((a: any, b: any) => a.version_number - b.version_number);

    return {
      success: true,
      data: {
        ...submittal,
        attachments: currentVersionAttachments,
        reviews: sortedReviews,
        versions: sortedVersions,
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
