'use server';

/**
 * Submittal Analytics Queries
 * Business intelligence and reporting functions
 */

import { createClient } from '@/lib/supabase/server';

export interface PipelineStats {
  draft: number;
  gcReview: number;
  aeReview: number;
  ownerReview: number;
  complete: number;
  total: number;
}

export interface CycleTimeStats {
  avgDaysToApproval: number;
  avgDaysInGCReview: number;
  avgDaysInAEReview: number;
  avgDaysInOwnerReview: number;
}

export interface ResubmittalStats {
  totalSubmittals: number;
  resubmitted: number;
  resubmittalRate: number;
}

export interface DivisionCycleTime {
  division: string;
  divisionTitle: string;
  avgDays: number;
  count: number;
}

export interface OverdueSubmittal {
  id: string;
  number: string;
  title: string;
  specSection: string;
  procurementDeadline: string;
  daysOverdue: number;
  currentStage: string;
  status: string;
}

/**
 * Get submittal pipeline statistics
 */
export async function getSubmittalPipelineStats(
  projectId: string
): Promise<PipelineStats | null> {
  try {
    const supabase = await createClient();

    const { data: submittals, error } = (await supabase
      .from('submittals')
      .select('current_stage')
      .eq('project_id', projectId)
      .is('deleted_at', null)) as any;

    if (error) {
      console.error('Error fetching pipeline stats:', error);
      return null;
    }

    const list = (submittals || []) as any[];

    return {
      draft: list.filter((s) => s.current_stage === 'draft').length,
      gcReview: list.filter((s) => s.current_stage === 'gc_review').length,
      aeReview: list.filter((s) => s.current_stage === 'ae_review').length,
      ownerReview: list.filter((s) => s.current_stage === 'owner_review').length,
      complete: list.filter((s) => s.current_stage === 'complete').length,
      total: list.length,
    };
  } catch (error) {
    console.error('Unexpected error in getSubmittalPipelineStats:', error);
    return null;
  }
}

/**
 * Get average cycle times from submission to approval
 */
export async function getAverageCycleTimes(
  projectId: string
): Promise<CycleTimeStats | null> {
  try {
    const supabase = await createClient();

    const { data: submittals, error } = (await supabase
      .from('submittals')
      .select('submitted_at, closed_at, status')
      .eq('project_id', projectId)
      .in('status', ['approved', 'approved_as_noted'])
      .not('submitted_at', 'is', null)
      .not('closed_at', 'is', null)
      .is('deleted_at', null)) as any;

    if (error) {
      console.error('Error fetching cycle times:', error);
      return null;
    }

    const list = (submittals || []) as any[];

    if (list.length === 0) {
      return {
        avgDaysToApproval: 0,
        avgDaysInGCReview: 0,
        avgDaysInAEReview: 0,
        avgDaysInOwnerReview: 0,
      };
    }

    // Calculate average days to approval
    const totalDays = list.reduce((sum, s) => {
      const submitted = new Date(s.submitted_at);
      const closed = new Date(s.closed_at);
      const days = Math.floor((closed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return {
      avgDaysToApproval: Math.round(totalDays / list.length),
      avgDaysInGCReview: 0, // TODO: Calculate from review history
      avgDaysInAEReview: 0, // TODO: Calculate from review history
      avgDaysInOwnerReview: 0, // TODO: Calculate from review history
    };
  } catch (error) {
    console.error('Unexpected error in getAverageCycleTimes:', error);
    return null;
  }
}

/**
 * Get resubmittal rate (percentage requiring revision)
 */
export async function getResubmittalRate(
  projectId: string
): Promise<ResubmittalStats | null> {
  try {
    const supabase = await createClient();

    const { data: submittals, error } = (await supabase
      .from('submittals')
      .select('id, parent_submittal_id')
      .eq('project_id', projectId)
      .is('deleted_at', null)) as any;

    if (error) {
      console.error('Error fetching resubmittal rate:', error);
      return null;
    }

    const list = (submittals || []) as any[];
    const total = list.length;
    const resubmitted = list.filter((s) => s.parent_submittal_id !== null).length;

    return {
      totalSubmittals: total,
      resubmitted,
      resubmittalRate: total > 0 ? Math.round((resubmitted / total) * 100) : 0,
    };
  } catch (error) {
    console.error('Unexpected error in getResubmittalRate:', error);
    return null;
  }
}

/**
 * Get average cycle times by CSI division
 */
export async function getCycleTimesByDivision(
  projectId: string
): Promise<DivisionCycleTime[]> {
  try {
    const supabase = await createClient();

    const { data: submittals, error } = (await supabase
      .from('submittals')
      .select('spec_section, submitted_at, closed_at')
      .eq('project_id', projectId)
      .in('status', ['approved', 'approved_as_noted'])
      .not('submitted_at', 'is', null)
      .not('closed_at', 'is', null)
      .is('deleted_at', null)) as any;

    if (error) {
      console.error('Error fetching division cycle times:', error);
      return [];
    }

    const list = (submittals || []) as any[];

    // Group by division (first 2 digits of spec section)
    const divisionMap = new Map<string, { totalDays: number; count: number }>();

    list.forEach((s) => {
      const division = s.spec_section.substring(0, 2);
      const submitted = new Date(s.submitted_at);
      const closed = new Date(s.closed_at);
      const days = Math.floor((closed.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24));

      if (!divisionMap.has(division)) {
        divisionMap.set(division, { totalDays: 0, count: 0 });
      }

      const stats = divisionMap.get(division)!;
      stats.totalDays += days;
      stats.count += 1;
    });

    // Convert to array and calculate averages
    const result: DivisionCycleTime[] = [];
    divisionMap.forEach((stats, division) => {
      result.push({
        division: `Division ${division}`,
        divisionTitle: getDivisionTitle(division),
        avgDays: Math.round(stats.totalDays / stats.count),
        count: stats.count,
      });
    });

    return result.sort((a, b) => a.division.localeCompare(b.division));
  } catch (error) {
    console.error('Unexpected error in getCycleTimesByDivision:', error);
    return [];
  }
}

/**
 * Get overdue submittals
 */
export async function getOverdueSubmittals(
  projectId: string
): Promise<OverdueSubmittal[]> {
  try {
    const supabase = await createClient();

    const today = new Date().toISOString().split('T')[0];

    const { data: submittals, error } = (await supabase
      .from('submittals')
      .select('id, number, title, spec_section, procurement_deadline, current_stage, status')
      .eq('project_id', projectId)
      .not('procurement_deadline', 'is', null)
      .lt('procurement_deadline', today)
      .not('status', 'in', '(approved,approved_as_noted,rejected,cancelled)')
      .is('deleted_at', null)
      .order('procurement_deadline', { ascending: true })) as any;

    if (error) {
      console.error('Error fetching overdue submittals:', error);
      return [];
    }

    const list = (submittals || []) as any[];
    const todayDate = new Date(today);

    return list.map((s) => {
      const deadline = new Date(s.procurement_deadline);
      const daysOverdue = Math.floor(
        (todayDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: s.id,
        number: s.number,
        title: s.title,
        specSection: s.spec_section,
        procurementDeadline: s.procurement_deadline,
        daysOverdue,
        currentStage: s.current_stage,
        status: s.status,
      };
    });
  } catch (error) {
    console.error('Unexpected error in getOverdueSubmittals:', error);
    return [];
  }
}

/**
 * Helper: Get division title from division code
 */
function getDivisionTitle(division: string): string {
  const titles: Record<string, string> = {
    '01': 'General Requirements',
    '02': 'Existing Conditions',
    '03': 'Concrete',
    '04': 'Masonry',
    '05': 'Metals',
    '06': 'Wood, Plastics, Composites',
    '07': 'Thermal and Moisture Protection',
    '08': 'Openings',
    '09': 'Finishes',
    '10': 'Specialties',
    '11': 'Equipment',
    '12': 'Furnishings',
    '13': 'Special Construction',
    '14': 'Conveying Equipment',
    '21': 'Fire Suppression',
    '22': 'Plumbing',
    '23': 'HVAC',
    '26': 'Electrical',
    '27': 'Communications',
    '28': 'Electronic Safety and Security',
    '31': 'Earthwork',
    '32': 'Exterior Improvements',
    '33': 'Utilities',
  };

  return titles[division] || 'Other';
}
