/**
 * Get Burn Rate Forecast
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'

export interface BurnRateForecast {
  daysElapsed: number
  daysTotal: number
  daysRemaining: number
  totalSpent: number
  dailyBurnRate: number
  forecastedTotal: number
  forecastedOverrun: number
  status: 'on_track' | 'warning' | 'critical'
}

export async function getBurnRateForecast(
  projectId: string
): Promise<ActionResponse<BurnRateForecast>> {
  try {
    if (!projectId) {
      return { success: false, error: 'Project ID is required' }
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Verify project access
    const { data: access, error: accessError } = await supabase
      .from('project_access')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()

    if (accessError || !access) {
      throw new UnauthorizedError('You do not have access to this project')
    }

    // Call the calculate_burn_rate function
    const { data, error } = await supabase
      .rpc('calculate_burn_rate', { p_project_id: projectId })
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Failed to calculate burn rate' }
    }

    const forecast: BurnRateForecast = {
      daysElapsed: data.days_elapsed,
      daysTotal: data.days_total,
      daysRemaining: data.days_remaining,
      totalSpent: Number(data.total_spent),
      dailyBurnRate: Number(data.daily_burn_rate),
      forecastedTotal: Number(data.forecasted_total),
      forecastedOverrun: Number(data.forecasted_overrun),
      status: data.status,
    }

    return { success: true, data: forecast }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate burn rate forecast',
    }
  }
}
