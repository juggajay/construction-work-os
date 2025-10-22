'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type EntryType = 'crew' | 'equipment' | 'material' | 'incident';

export interface DeleteEntryInput {
  entryId: string;
  entryType: EntryType;
  dailyReportId: string; // For revalidation
}

export interface DeleteEntryResult {
  success: boolean;
  error?: string;
}

const TABLE_MAP: Record<EntryType, string> = {
  crew: 'daily_report_crew_entries',
  equipment: 'daily_report_equipment_entries',
  material: 'daily_report_material_entries',
  incident: 'daily_report_incidents',
};

/**
 * Delete entry from daily report (draft status only)
 * Works for crew, equipment, material, and incident entries
 */
export async function deleteEntry(
  input: DeleteEntryInput
): Promise<DeleteEntryResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate daily report is draft
    const { data: report, error: fetchError } = await supabase
      .from('daily_reports')
      .select('status, project_id')
      .eq('id', input.dailyReportId)
      .single();

    if (fetchError || !report) {
      return { success: false, error: 'Daily report not found' };
    }

    // Type assertion for query result
    const reportData = report as any;

    if (reportData.status !== 'draft') {
      return {
        success: false,
        error: 'Cannot delete entries from non-draft reports',
      };
    }

    // Get table name
    const tableName = TABLE_MAP[input.entryType];
    if (!tableName) {
      return { success: false, error: 'Invalid entry type' };
    }

    // Delete entry
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', input.entryId)
      .eq('daily_report_id', input.dailyReportId); // Safety: ensure entry belongs to this report

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Revalidate paths
    revalidatePath(
      `/[orgSlug]/projects/${reportData.project_id}/daily-reports/${input.dailyReportId}`
    );

    return { success: true };
  } catch (error) {
    console.error('Error deleting entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
