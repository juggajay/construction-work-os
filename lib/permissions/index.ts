/**
 * Permission Utilities
 * Centralized permission checking for role-based access control
 */

import { createClient } from '@/lib/supabase/server'
import { ForbiddenError } from '@/lib/utils/errors'
import type { Permission } from './constants'
import { PERMISSION_RPC_MAPPING } from './constants'

export type { Permission } from './constants'
export { PERMISSION_DESCRIPTIONS, PERMISSION_RPC_MAPPING } from './constants'

export interface PermissionCheck {
  permission: Permission
  projectId: string
  userId?: string
  resourceId?: string // For ownership checks (cost_id, report_id, etc.)
}

/**
 * Check if user has permission for a specific action
 *
 * @param check - Permission check configuration
 * @returns true if user has permission, false otherwise
 *
 * @example
 * const canEdit = await hasPermission({
 *   permission: 'edit_budget',
 *   projectId: 'abc-123'
 * })
 */
export async function hasPermission(check: PermissionCheck): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Get user ID if not provided
    let userId = check.userId
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      userId = user.id
    }

    // Get RPC function name for this permission
    const rpcFunction = PERMISSION_RPC_MAPPING[check.permission]

    // If no RPC function, permission is granted to all project members
    // (e.g., view permissions)
    if (!rpcFunction) {
      // Check if user has access to project via user_project_ids()
      const { data: projectIds, error } = await supabase.rpc('user_project_ids', {
        user_uuid: userId,
      })

      if (error) {
        console.error('Error checking project access:', error)
        return false
      }

      return projectIds?.some((p: { project_id: string }) =>
        p.project_id === check.projectId
      ) ?? false
    }

    // Call the appropriate permission check function
    const params: Record<string, string> = {
      user_uuid: userId,
      check_project_id: check.projectId,
    }

    // Add resource ID if provided (for ownership checks)
    if (check.resourceId) {
      // Determine parameter name based on permission
      if (check.permission.includes('cost')) {
        params.cost_id = check.resourceId
      } else if (check.permission.includes('daily_report')) {
        params.report_id = check.resourceId
      }
    }

    const { data, error } = await supabase.rpc(rpcFunction as any, params)

    if (error) {
      console.error(`Permission check error for ${check.permission}:`, error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Permission check exception:', error)
    return false
  }
}

/**
 * Assert user has permission or throw ForbiddenError
 * Use this in server actions to enforce permissions
 *
 * @param check - Permission check configuration
 * @throws {ForbiddenError} if user lacks permission
 *
 * @example
 * export async function updateBudget(data: UpdateBudgetInput) {
 *   await assertPermission({
 *     permission: 'edit_budget',
 *     projectId: data.projectId
 *   })
 *   // ... rest of logic
 * }
 */
export async function assertPermission(check: PermissionCheck): Promise<void> {
  const allowed = await hasPermission(check)

  if (!allowed) {
    throw new ForbiddenError(
      `You don't have permission to ${check.permission} on this project`
    )
  }
}

/**
 * Get all permissions for user on a project
 * Useful for batch permission checks on page load
 *
 * @param projectId - Project to check permissions for
 * @param userId - Optional user ID (defaults to current user)
 * @returns Set of permissions the user has
 *
 * @example
 * const permissions = await getUserPermissions('abc-123')
 * if (permissions.has('edit_budget')) {
 *   // Show edit button
 * }
 */
export async function getUserPermissions(
  projectId: string,
  userId?: string
): Promise<Set<Permission>> {
  const permissions = new Set<Permission>()

  // List of all permissions to check
  const allPermissions: Permission[] = [
    'view_project',
    'edit_project',
    'delete_project',
    'view_budget',
    'edit_budget',
    'view_costs',
    'create_cost',
    'edit_cost',
    'delete_cost',
    'view_change_orders',
    'create_change_order',
    'approve_change_order',
    'view_daily_reports',
    'create_daily_report',
    'edit_daily_report',
    'view_rfis',
    'submit_rfi',
    'respond_to_rfi',
    'close_rfi',
    'view_submittals',
    'create_submittal',
    'review_submittal',
    'approve_submittal',
    'view_team',
    'manage_team',
  ]

  // Check each permission in parallel
  await Promise.all(
    allPermissions.map(async (permission) => {
      const allowed = await hasPermission({
        permission,
        projectId,
        userId,
      })
      if (allowed) {
        permissions.add(permission)
      }
    })
  )

  return permissions
}

/**
 * Check multiple permissions at once
 * More efficient than multiple hasPermission calls
 *
 * @param checks - Array of permission checks
 * @returns Map of permission to boolean result
 */
export async function checkPermissions(
  checks: PermissionCheck[]
): Promise<Map<Permission, boolean>> {
  const results = new Map<Permission, boolean>()

  await Promise.all(
    checks.map(async (check) => {
      const allowed = await hasPermission(check)
      results.set(check.permission, allowed)
    })
  )

  return results
}
