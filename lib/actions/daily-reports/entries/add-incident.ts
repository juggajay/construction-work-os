'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface AddIncidentInput {
  dailyReportId: string;
  incidentType: 'safety' | 'delay' | 'quality' | 'visitor' | 'inspection' | 'other';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timeOccurred?: string; // HH:MM
  description: string;
  involvedParties?: string;
  correctiveAction?: string;
  reportedTo?: string;
  followUpRequired?: boolean;
  oshaRecordable?: boolean;
  notes?: string;
}

interface AddIncidentResult {
  success: boolean;
  data?: { id: string };
  error?: string;
}

/**
 * Add incident entry to daily report (draft status only)
 * Sends notification if OSHA-recordable
 */
export async function addIncident(
  input: AddIncidentInput
): Promise<AddIncidentResult> {
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
    if (!input.description || input.description.trim().length === 0) {
      return { success: false, error: 'Description is required' };
    }

    // Insert incident entry
    const { data: entry, error: insertError } = await supabase
      .from('daily_report_incidents')
      .insert({
        daily_report_id: input.dailyReportId,
        incident_type: input.incidentType,
        severity: input.severity,
        time_occurred: input.timeOccurred,
        description: input.description.trim(),
        involved_parties: input.involvedParties,
        corrective_action: input.correctiveAction,
        reported_to: input.reportedTo,
        follow_up_required: input.followUpRequired || false,
        osha_recordable: input.oshaRecordable || false,
        notes: input.notes,
      })
      .select('id')
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // TODO: If OSHA-recordable, send notification to safety manager

    // Revalidate paths
    revalidatePath(`/[orgSlug]/projects/${report.project_id}/daily-reports/${input.dailyReportId}`);

    return { success: true, data: { id: entry.id } };
  } catch (error) {
    console.error('Error adding incident:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
