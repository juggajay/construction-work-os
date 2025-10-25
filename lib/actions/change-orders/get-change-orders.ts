/**
 * Get Change Orders Server Action
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrder } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface GetChangeOrdersFilters {
  projectId: string
  status?: string | string[]
  type?: string | string[]
  search?: string
  page?: number
  pageSize?: number
}

export async function getChangeOrders(
  filters: GetChangeOrdersFilters
): Promise<ActionResponse<{ data: ChangeOrder[]; total: number }>> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Build query
    let query = supabase
      .from('change_orders')
      .select('*', { count: 'exact' })
      .eq('project_id', filters.projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status as any)
      } else {
        query = query.eq('status', filters.status as any)
      }
    }

    if (filters.type) {
      if (Array.isArray(filters.type)) {
        query = query.in('type', filters.type as any)
      } else {
        query = query.eq('type', filters.type as any)
      }
    }

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    // Apply pagination
    const page = filters.page || 1
    const pageSize = filters.pageSize || 50
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Get change orders error:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch change orders',
      }
    }

    return {
      success: true,
      data: {
        data: data as ChangeOrder[],
        total: count || 0,
      },
    }
  } catch (error) {
    console.error('Get change orders error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch change orders',
    }
  }
}
