'use server';

import { createClient } from '@/lib/supabase/server';
import { GetSubmittalListSchema } from './schemas';
import { z } from 'zod';

export type GetSubmittalListInput = z.infer<typeof GetSubmittalListSchema>;

export interface SubmittalListItem {
  id: string;
  number: string;
  title: string;
  submittal_type: string;
  spec_section: string;
  spec_section_title: string | null;
  status: string;
  current_stage: string;
  current_reviewer_id: string | null;
  procurement_deadline: string | null;
  submitted_at: string | null;
  version: string;
}

export interface GetSubmittalListResult {
  success: boolean;
  data?: {
    submittals: SubmittalListItem[];
    total: number;
  };
  error?: string;
}

/**
 * Get paginated list of submittals with filters
 * Supports filtering by status, stage, spec section, overdue, assigned to me
 */
export async function getSubmittalList(
  input: unknown
): Promise<GetSubmittalListResult> {
  try {
    // Validate input
    const validated = GetSubmittalListSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Build query
    let query = supabase
      .from('submittals')
      .select('id, number, title, submittal_type, spec_section, spec_section_title, status, current_stage, current_reviewer_id, procurement_deadline, submitted_at, version', { count: 'exact' })
      .eq('project_id', validated.projectId)
      .is('deleted_at', null);

    // Apply filters
    if (validated.status) {
      query = query.eq('status', validated.status);
    }

    if (validated.currentStage) {
      query = query.eq('current_stage', validated.currentStage);
    }

    if (validated.specSection) {
      // Partial match on spec section (e.g., "03" matches all Division 03)
      query = query.ilike('spec_section', `${validated.specSection}%`);
    }

    if (validated.overdue) {
      // Overdue: procurement_deadline < TODAY and not yet approved/rejected
      const today = new Date().toISOString().split('T')[0];
      query = query
        .lt('procurement_deadline', today)
        .not('status', 'in', ['approved', 'approved_as_noted', 'rejected', 'cancelled'].join(','));
    }

    if (validated.assignedToMe) {
      query = query.eq('current_reviewer_id', user.id);
    }

    // Sort by spec section and number
    query = query.order('spec_section', { ascending: true });
    query = query.order('number', { ascending: true });

    // Pagination
    query = query.range(validated.offset, validated.offset + validated.limit - 1);

    // Execute query
    const { data: submittals, error: queryError, count } = await query;

    if (queryError) {
      console.error('Error fetching submittals:', queryError);
      return { success: false, error: 'Failed to fetch submittals' };
    }

    return {
      success: true,
      data: {
        submittals: submittals || [],
        total: count || 0,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
      };
    }

    console.error('Unexpected error fetching submittals:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
