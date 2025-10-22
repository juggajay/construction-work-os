'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CopyFromPreviousInput {
  projectId: string;
  reportDate: string; // YYYY-MM-DD for new report
}

interface CopyFromPreviousResult {
  success: boolean;
  data?: {
    id: string;
    copiedFrom: string; // previous report date
    crewEntriesCopied: number;
    equipmentEntriesCopied: number;
  };
  error?: string;
}

/**
 * Create new daily report by copying crew/equipment from previous day
 * Does NOT copy: narrative, incidents, attachments, materials
 */
export async function copyFromPreviousReport(
  input: CopyFromPreviousInput
): Promise<CopyFromPreviousResult> {
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

    // Find most recent report before requested date
    const { data: previousReport, error: fetchError } = await supabase
      .from('daily_reports')
      .select(
        `
        *,
        crew_entries:daily_report_crew_entries(*),
        equipment_entries:daily_report_equipment_entries(*)
      `
      )
      .eq('project_id', input.projectId)
      .lt('report_date', input.reportDate)
      .order('report_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!previousReport) {
      return {
        success: false,
        error: 'No previous report found to copy from',
      };
    }

    // Create new draft report
    const { data: newReport, error: createError } = await supabase
      .from('daily_reports')
      .insert({
        project_id: input.projectId,
        report_date: input.reportDate,
        status: 'draft',
        created_by: user.id,
        work_hours_start: previousReport.work_hours_start,
        work_hours_end: previousReport.work_hours_end,
      })
      .select('id')
      .single();

    if (createError) {
      return { success: false, error: createError.message };
    }

    let crewEntriesCopied = 0;
    let equipmentEntriesCopied = 0;

    // Copy crew entries (without notes)
    if (previousReport.crew_entries && previousReport.crew_entries.length > 0) {
      const crewEntries = previousReport.crew_entries.map((entry: any) => ({
        daily_report_id: newReport.id,
        trade: entry.trade,
        csi_division: entry.csi_division,
        subcontractor_org_id: entry.subcontractor_org_id,
        headcount: entry.headcount,
        hours_worked: entry.hours_worked,
        classification: entry.classification,
        hourly_rate: entry.hourly_rate,
        notes: '', // Don't copy date-specific notes
      }));

      const { error: crewError } = await supabase
        .from('daily_report_crew_entries')
        .insert(crewEntries);

      if (!crewError) {
        crewEntriesCopied = crewEntries.length;
      }
    }

    // Copy equipment entries (without notes)
    if (
      previousReport.equipment_entries &&
      previousReport.equipment_entries.length > 0
    ) {
      const equipmentEntries = previousReport.equipment_entries.map(
        (entry: any) => ({
          daily_report_id: newReport.id,
          equipment_type: entry.equipment_type,
          equipment_id: entry.equipment_id,
          operator_name: entry.operator_name,
          hours_used: entry.hours_used,
          fuel_consumed: entry.fuel_consumed,
          rental_cost: entry.rental_cost,
          notes: '', // Don't copy date-specific notes
        })
      );

      const { error: equipmentError } = await supabase
        .from('daily_report_equipment_entries')
        .insert(equipmentEntries);

      if (!equipmentError) {
        equipmentEntriesCopied = equipmentEntries.length;
      }
    }

    // Revalidate paths
    revalidatePath(`/[orgSlug]/projects/${input.projectId}/daily-reports`);

    return {
      success: true,
      data: {
        id: newReport.id,
        copiedFrom: previousReport.report_date,
        crewEntriesCopied,
        equipmentEntriesCopied,
      },
    };
  } catch (error) {
    console.error('Error copying from previous report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
