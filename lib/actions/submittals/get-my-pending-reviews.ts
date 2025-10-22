'use server';

import { createClient } from '@/lib/supabase/server';
import { GetMyPendingReviewsSchema } from './schemas';
import { z } from 'zod';

export type GetMyPendingReviewsInput = z.infer<typeof GetMyPendingReviewsSchema>;

export interface PendingReview {
  id: string;
  number: string;
  title: string;
  spec_section: string;
  status: string;
  current_stage: string;
  submitted_at: string | null;
  days_pending: number;
  is_overdue: boolean;
  procurement_deadline: string | null;
  project_id: string;
}

export interface GetMyPendingReviewsResult {
  success: boolean;
  data?: {
    reviews: PendingReview[];
    total: number;
  };
  error?: string;
}

/**
 * Get all submittals assigned to current user for review
 * Sorted by days pending (oldest first), with urgency indicators
 */
export async function getMyPendingReviews(
  input: unknown
): Promise<GetMyPendingReviewsResult> {
  try {
    // Validate input
    const validated = GetMyPendingReviewsSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch submittals assigned to current user
    const { data: submittals, error: queryError, count } = await supabase
      .from('submittals')
      .select('id, number, title, spec_section, status, current_stage, submitted_at, procurement_deadline, project_id', { count: 'exact' })
      .eq('current_reviewer_id', user.id)
      .in('current_stage', ['gc_review', 'ae_review', 'owner_review'])
      .is('deleted_at', null)
      .order('submitted_at', { ascending: true })
      .limit(validated.limit);

    if (queryError) {
      console.error('Error fetching pending reviews:', queryError);
      return { success: false, error: 'Failed to fetch pending reviews' };
    }

    // Calculate days pending and urgency
    const now = new Date();
    const reviewsWithMetrics = (submittals || []).map((submittal) => {
      let daysPending = 0;
      if (submittal.submitted_at) {
        const submittedDate = new Date(submittal.submitted_at);
        daysPending = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      const isOverdue = daysPending > 7; // Consider overdue if pending > 7 days

      return {
        ...submittal,
        days_pending: daysPending,
        is_overdue: isOverdue,
      };
    });

    return {
      success: true,
      data: {
        reviews: reviewsWithMetrics,
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

    console.error('Unexpected error fetching pending reviews:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
