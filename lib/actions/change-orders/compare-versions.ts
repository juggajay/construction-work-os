/**
 * Compare Two Versions (for side-by-side display)
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse, ChangeOrderLineItem } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface VersionComparison {
  version1: {
    versionNumber: number
    lineItems: ChangeOrderLineItem[]
    totalCost: string
  }
  version2: {
    versionNumber: number
    lineItems: ChangeOrderLineItem[]
    totalCost: string
  }
  costDifference: string
}

export async function compareVersions(
  changeOrderId: string,
  version1: number,
  version2: number
): Promise<ActionResponse<VersionComparison>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Get line items for version 1
    const { data: lineItems1 } = await supabase
      .from('change_order_line_items')
      .select('*')
      .eq('change_order_id', changeOrderId)
      .eq('version', version1)
      .order('sort_order', { ascending: true })

    // Get line items for version 2
    const { data: lineItems2 } = await supabase
      .from('change_order_line_items')
      .select('*')
      .eq('change_order_id', changeOrderId)
      .eq('version', version2)
      .order('sort_order', { ascending: true })

    if (!lineItems1 || !lineItems2) {
      return { success: false, error: 'Version not found' }
    }

    // Calculate totals
    const total1 = lineItems1.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.total_amount || '0')
    }, 0)

    const total2 = lineItems2.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.total_amount || '0')
    }, 0)

    const comparison: VersionComparison = {
      version1: {
        versionNumber: version1,
        lineItems: lineItems1 as ChangeOrderLineItem[],
        totalCost: total1.toFixed(2),
      },
      version2: {
        versionNumber: version2,
        lineItems: lineItems2 as ChangeOrderLineItem[],
        totalCost: total2.toFixed(2),
      },
      costDifference: (total2 - total1).toFixed(2),
    }

    return { success: true, data: comparison }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare versions',
    }
  }
}
