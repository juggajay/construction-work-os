/**
 * Get all invoices for a project
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { logger } from '@/lib/utils/logger'

export interface ProjectInvoice {
  id: string
  vendor_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  amount: number
  budget_category: string
  status: string
  file_path: string
  file_name: string
  ai_parsed: boolean
  ai_confidence: number | null
  created_at: string
  uploaded_by: string
}

export async function getProjectInvoices(
  projectId: string
): Promise<ActionResponse<ProjectInvoice[]>> {
  logger.debug('Fetching project invoices', {
    action: 'getProjectInvoices',
    projectId,
  })

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.error('No user found', new Error('Authentication required'), {
        action: 'getProjectInvoices',
      })
      return { success: false, error: 'You must be logged in' }
    }

    // Fetch invoices for the project
    const { data: invoices, error } = await supabase
      .from('project_invoices')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch invoices', error, {
        action: 'getProjectInvoices',
        projectId,
      })
      return { success: false, error: 'Failed to fetch invoices' }
    }

    logger.info('Invoices fetched successfully', {
      action: 'getProjectInvoices',
      projectId,
      count: invoices?.length || 0,
    })

    return { success: true, data: invoices as ProjectInvoice[] }
  } catch (error) {
    logger.error('Unexpected error fetching invoices', error as Error, {
      action: 'getProjectInvoices',
      projectId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invoices',
    }
  }
}
