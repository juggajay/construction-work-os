'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface AddMaterialEntryInput {
  dailyReportId: string;
  materialDescription: string;
  supplier?: string;
  quantity: number;
  unit: string;
  deliveryTime?: string; // HH:MM
  deliveryTicket?: string;
  location?: string;
  notes?: string;
}

interface AddMaterialEntryResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

/**
 * Add material entry to daily report (draft status only)
 */
export async function addMaterialEntry(
  input: AddMaterialEntryInput
): Promise<AddMaterialEntryResult> {
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
    if (
      !input.materialDescription ||
      input.materialDescription.trim().length === 0
    ) {
      return { success: false, error: 'Material description is required' };
    }

    if (!input.unit || input.unit.trim().length === 0) {
      return { success: false, error: 'Unit is required' };
    }

    if (input.quantity <= 0) {
      return { success: false, error: 'Quantity must be greater than 0' };
    }

    // Insert material entry
    const { data: entry, error: insertError } = await supabase
      .from('daily_report_material_entries')
      .insert({
        daily_report_id: input.dailyReportId,
        material_description: input.materialDescription.trim(),
        supplier: input.supplier,
        quantity: input.quantity,
        unit: input.unit.trim(),
        delivery_time: input.deliveryTime,
        delivery_ticket: input.deliveryTicket,
        location: input.location,
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
    console.error('Error adding material entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
