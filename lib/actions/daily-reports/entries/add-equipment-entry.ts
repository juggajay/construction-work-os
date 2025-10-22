'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface AddEquipmentEntryInput {
  dailyReportId: string;
  equipmentType: string;
  equipmentId?: string;
  operatorName?: string;
  hoursUsed: number;
  fuelConsumed?: number;
  rentalCost?: number;
  notes?: string;
}

interface AddEquipmentEntryResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

/**
 * Add equipment entry to daily report (draft status only)
 */
export async function addEquipmentEntry(
  input: AddEquipmentEntryInput
): Promise<AddEquipmentEntryResult> {
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

    if (report.status !== 'draft') {
      return {
        success: false,
        error: 'Cannot add entries to non-draft reports',
      };
    }

    // Validate input
    if (!input.equipmentType || input.equipmentType.trim().length === 0) {
      return { success: false, error: 'Equipment type is required' };
    }

    if (input.hoursUsed <= 0) {
      return { success: false, error: 'Hours used must be greater than 0' };
    }

    // Insert equipment entry
    const { data: entry, error: insertError } = await supabase
      .from('daily_report_equipment_entries')
      .insert({
        daily_report_id: input.dailyReportId,
        equipment_type: input.equipmentType.trim(),
        equipment_id: input.equipmentId,
        operator_name: input.operatorName,
        hours_used: input.hoursUsed,
        fuel_consumed: input.fuelConsumed,
        rental_cost: input.rentalCost,
        notes: input.notes,
      })
      .select('id')
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Revalidate paths
    revalidatePath(`/[orgSlug]/projects/${report.project_id}/daily-reports/${input.dailyReportId}`);

    return { success: true, data: { id: entry.id } };
  } catch (error) {
    console.error('Error adding equipment entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
