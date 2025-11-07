/**
 * Get Project Detail with Invoices
 * Fetches detailed project information including all invoices with uploader info
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { logger } from '@/lib/utils/logger'

export interface InvoiceWithUploader {
  id: string
  vendor_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  amount: number
  budget_category: string
  status: string
  file_path: string
  file_name: string
  mime_type: string
  ai_parsed: boolean | null
  ai_confidence: number | null
  created_at: string
  uploaded_by: string
  uploader_name: string | null
  uploader_email: string | null
}

export interface DirectCostWithCreator {
  id: string
  amount: number
  budget_category: string
  description: string | null
  cost_date: string
  created_at: string
  created_by: string
  creator_name: string | null
  creator_email: string | null
}

export interface ProjectDetail {
  id: string
  name: string
  status: string
  budget: number
  totalSpent: number
  totalAllocated: number
  percentSpent: number
  healthStatus: 'healthy' | 'warning' | 'critical'
  categoryBreakdown: Array<{
    category: string
    allocated: number
    spent: number
    remaining: number
    percentSpent: number
  }>
  invoices: InvoiceWithUploader[]
  directCosts: DirectCostWithCreator[]
}

export async function getProjectDetail(
  projectId: string
): Promise<ActionResponse<ProjectDetail>> {
  logger.debug('Fetching project detail', {
    action: 'getProjectDetail',
    projectId,
  })

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      logger.error('No user found', new Error('Authentication required'), {
        action: 'getProjectDetail',
      })
      throw new UnauthorizedError('You must be logged in')
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, status, budget, org_id')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (projectError || !project) {
      logger.error('Project not found', projectError || new Error('Project not found'), {
        action: 'getProjectDetail',
        projectId,
      })
      return { success: false, error: 'Project not found' }
    }

    // Verify user has access (check org membership)
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('org_id', project.org_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (membershipError || !membership) {
      logger.error('Access denied - not org member', membershipError || new Error('Not authorized'), {
        action: 'getProjectDetail',
        projectId,
        userId: user.id,
      })
      throw new UnauthorizedError('You do not have access to this project')
    }

    // Fetch cost summary
    const { data: costSummary } = await supabase
      .from('project_cost_summary')
      .select('category, allocated_amount, spent_amount, remaining_amount, spent_percentage')
      .eq('project_id', projectId)

    // Calculate totals
    const totalSpent = (costSummary || []).reduce(
      (sum, item) => sum + Number(item.spent_amount || 0),
      0
    )
    const totalAllocated = (costSummary || []).reduce(
      (sum, item) => sum + Number(item.allocated_amount || 0),
      0
    )

    const budget = Number(project.budget || 0)
    const percentSpent = budget > 0 ? (totalSpent / budget) * 100 : 0

    // Determine health status
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (percentSpent >= 90) {
      healthStatus = 'critical'
    } else if (percentSpent >= 70) {
      healthStatus = 'warning'
    }

    // Transform category breakdown
    const categoryBreakdown = (costSummary || [])
      .filter((item) => item.category !== null)
      .map((item) => ({
        category: item.category as string,
        allocated: Number(item.allocated_amount || 0),
        spent: Number(item.spent_amount || 0),
        remaining: Number(item.remaining_amount || 0),
        percentSpent: Number(item.spent_percentage || 0),
      }))

    // Fetch invoices with uploader information
    const { data: invoices, error: invoicesError } = await supabase
      .from('project_invoices')
      .select(`
        id,
        vendor_name,
        invoice_number,
        invoice_date,
        amount,
        budget_category,
        status,
        file_path,
        file_name,
        mime_type,
        ai_parsed,
        ai_confidence,
        created_at,
        uploaded_by
      `)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      logger.error('Failed to fetch invoices', invoicesError, {
        action: 'getProjectDetail',
        projectId,
      })
      return { success: false, error: 'Failed to fetch invoices' }
    }

    // Fetch uploader profiles for all invoices
    const uploaderIds = [...new Set((invoices || []).map((i) => i.uploaded_by))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uploaderIds)

    // Create a map of uploader ID to profile
    const uploaderMap = new Map(
      (profiles || []).map((p) => [p.id, { name: p.full_name, email: null }])
    )

    // Combine invoice data with uploader info
    const invoicesWithUploaders: InvoiceWithUploader[] = (invoices || []).map((invoice) => {
      const uploader = uploaderMap.get(invoice.uploaded_by)
      return {
        ...invoice,
        uploader_name: uploader?.name || null,
        uploader_email: uploader?.email || null,
      }
    })

    // Fetch direct costs with creator information
    const { data: directCosts, error: directCostsError } = await supabase
      .from('project_costs')
      .select(`
        id,
        amount,
        budget_category,
        description,
        cost_date,
        created_at,
        created_by
      `)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('cost_date', { ascending: false })

    if (directCostsError) {
      logger.error('Failed to fetch direct costs', directCostsError, {
        action: 'getProjectDetail',
        projectId,
      })
      return { success: false, error: 'Failed to fetch direct costs' }
    }

    // Fetch creator profiles for all direct costs
    const creatorIds = [...new Set((directCosts || []).map((c) => c.created_by))]
    const { data: creatorProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', creatorIds)

    // Create a map of creator ID to profile
    const creatorMap = new Map(
      (creatorProfiles || []).map((p) => [p.id, { name: p.full_name, email: null }])
    )

    // Combine direct costs data with creator info
    const directCostsWithCreators: DirectCostWithCreator[] = (directCosts || []).map((cost) => {
      const creator = creatorMap.get(cost.created_by)
      return {
        ...cost,
        creator_name: creator?.name || null,
        creator_email: creator?.email || null,
      }
    })

    const projectDetail: ProjectDetail = {
      id: project.id,
      name: project.name,
      status: project.status,
      budget,
      totalSpent,
      totalAllocated,
      percentSpent,
      healthStatus,
      categoryBreakdown,
      invoices: invoicesWithUploaders,
      directCosts: directCostsWithCreators,
    }

    logger.info('Project detail fetched successfully', {
      action: 'getProjectDetail',
      projectId,
      invoiceCount: invoicesWithUploaders.length,
      directCostCount: directCostsWithCreators.length,
    })

    return { success: true, data: projectDetail }
  } catch (error) {
    logger.error('Unexpected error fetching project detail', error as Error, {
      action: 'getProjectDetail',
      projectId,
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project detail',
    }
  }
}
