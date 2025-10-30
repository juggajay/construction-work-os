/**
 * Analytics Actions
 * Fetch and calculate analytics data for dashboards
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/types'
import { UnauthorizedError } from '@/lib/utils/errors'
import { OrgIdSchema } from '@/lib/validations/analytics'
import { z } from 'zod'

export interface ProjectAnalytics {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  onHoldProjects: number
  totalBudget: number
  totalSpent: number
  averageCompletion: number
}

export interface OrganizationKPIs {
  totalProjects: number
  activeProjects: number
  totalTeamMembers: number
  openRFIs: number
  pendingSubmittals: number
  totalBudget: number
  totalSpent: number
  budgetUtilization: number
}

// TypeScript types for database query results
type ProjectRow = {
  id: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
  budget: number | null
  start_date?: string | null
  end_date?: string | null
}

type CostRow = {
  amount: number | null
}

/**
 * Get organization-wide KPIs
 * Fetches analytics data for the organization dashboard including project counts,
 * team size, open workflow items, and budget utilization
 */
export async function getOrganizationKPIs(
  orgId: string
): Promise<ActionResponse<OrganizationKPIs>> {
  try {
    // Validate input
    OrgIdSchema.parse(orgId)

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Execute all queries in parallel including auth check for better performance
    const [orgMemberResult, projectsResult, teamCountResult] = await Promise.all([
      supabase
        .from('organization_members')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle(),
      supabase
        .from('projects')
        .select('id, status, budget')
        .eq('org_id', orgId)
        .is('deleted_at', null),
      supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .is('deleted_at', null),
    ])

    // Check authorization after parallel queries
    if (orgMemberResult.error || !orgMemberResult.data) {
      throw new UnauthorizedError('You do not have access to this organization')
    }

    const projects = projectsResult.data || []
    const totalProjects = projects.length
    const activeProjects = projects.filter((p: ProjectRow) => p.status === 'active').length
    const totalBudget = projects.reduce(
      (sum: number, p: ProjectRow) => sum + (Number(p.budget) || 0),
      0
    )

    // Only query workflow items and costs if we have projects
    const projectIds = projects.map((p: ProjectRow) => p.id)

    let openRFICount = 0
    let pendingSubmittalCount = 0
    let totalSpent = 0

    if (projectIds.length > 0) {
      // Execute workflow and cost queries in parallel
      const [rfiResult, submittalResult, costsResult] = await Promise.all([
        supabase
          .from('rfis')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open')
          .in('project_id', projectIds)
          .is('deleted_at', null),
        supabase
          .from('submittals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted')
          .in('project_id', projectIds)
          .is('deleted_at', null),
        supabase
          .from('project_costs')
          .select('amount')
          .in('project_id', projectIds)
          .is('deleted_at', null),
      ])

      openRFICount = rfiResult.count || 0
      pendingSubmittalCount = submittalResult.count || 0
      const costs = costsResult.data || []
      totalSpent = costs.reduce((sum: number, c: CostRow) => sum + (Number(c.amount) || 0), 0)
    }

    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    return {
      success: true,
      data: {
        totalProjects,
        activeProjects,
        totalTeamMembers: teamCountResult.count || 0,
        openRFIs: openRFICount,
        pendingSubmittals: pendingSubmittalCount,
        totalBudget,
        totalSpent,
        budgetUtilization,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid input',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organization KPIs',
    }
  }
}

/**
 * Get project analytics
 * Calculates comprehensive project statistics including status counts,
 * budget totals, and average completion percentage
 */
export async function getProjectAnalytics(
  orgId: string
): Promise<ActionResponse<ProjectAnalytics>> {
  try {
    // Validate input
    OrgIdSchema.parse(orgId)

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new UnauthorizedError('You must be logged in')
    }

    // Execute queries in parallel including auth check
    const [orgMemberResult, projectsResult] = await Promise.all([
      supabase
        .from('organization_members')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle(),
      supabase
        .from('projects')
        .select('id, status, budget, start_date, end_date')
        .eq('org_id', orgId)
        .is('deleted_at', null),
    ])

    // Check authorization after parallel queries
    if (orgMemberResult.error || !orgMemberResult.data) {
      throw new UnauthorizedError('You do not have access to this organization')
    }

    const projects = projectsResult.data

    const projectList = projects || []
    const totalProjects = projectList.length
    const activeProjects = projectList.filter((p: ProjectRow) => p.status === 'active').length
    const completedProjects = projectList.filter(
      (p: ProjectRow) => p.status === 'completed'
    ).length
    const onHoldProjects = projectList.filter((p: ProjectRow) => p.status === 'on_hold').length

    const totalBudget = projectList.reduce(
      (sum: number, p: ProjectRow) => sum + (Number(p.budget) || 0),
      0
    )

    // Only query costs if we have projects
    const projectIds = projectList.map((p: ProjectRow) => p.id)
    let totalSpent = 0

    if (projectIds.length > 0) {
      const { data: costs } = await supabase
        .from('project_costs')
        .select('amount')
        .in('project_id', projectIds)
        .is('deleted_at', null)

      const costsList = costs || []
      totalSpent = costsList.reduce((sum: number, c: CostRow) => sum + (Number(c.amount) || 0), 0)
    }

    /**
     * Calculate average project completion percentage
     * - Completed projects: 100%
     * - Active projects: Based on time elapsed between start and end dates
     * - Projects past end date: 100%
     * - Projects without dates: Excluded from calculation
     */
    let totalCompletion = 0
    let projectsWithDates = 0

    projectList.forEach((project: ProjectRow) => {
      if (project.start_date && project.end_date) {
        const start = new Date(project.start_date).getTime()
        const end = new Date(project.end_date).getTime()
        const now = new Date().getTime()

        if (project.status === 'completed') {
          totalCompletion += 100
        } else if (now >= start && now <= end) {
          const elapsed = now - start
          const total = end - start
          totalCompletion += Math.min((elapsed / total) * 100, 100)
        } else if (now > end) {
          totalCompletion += 100
        }

        projectsWithDates++
      }
    })

    const averageCompletion = projectsWithDates > 0 ? totalCompletion / projectsWithDates : 0

    return {
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        onHoldProjects,
        totalBudget,
        totalSpent,
        averageCompletion,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid input',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project analytics',
    }
  }
}
