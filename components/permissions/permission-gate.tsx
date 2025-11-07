/**
 * PermissionGate Component
 * Conditionally renders children based on user permissions
 */

'use client'

import { usePermission } from '@/hooks/use-permission'
import type { Permission } from '@/lib/permissions'
import type { ReactNode } from 'react'

interface PermissionGateProps {
  /** Permission to check */
  permission: Permission
  /** Project ID to check permission for */
  projectId: string
  /** Optional resource ID for ownership checks */
  resourceId?: string
  /** Content to render if user has permission */
  children: ReactNode
  /** Optional content to render if user lacks permission */
  fallback?: ReactNode
  /** Optional loading state */
  loadingFallback?: ReactNode
}

/**
 * Conditionally renders children based on user permissions
 *
 * @example
 * // Simple usage - hide button if no permission
 * <PermissionGate permission="edit_budget" projectId={projectId}>
 *   <Button>Edit Budget</Button>
 * </PermissionGate>
 *
 * @example
 * // With fallback message
 * <PermissionGate
 *   permission="manage_team"
 *   projectId={projectId}
 *   fallback={<p>Only admins can manage teams</p>}
 * >
 *   <AddTeamMemberDialog />
 * </PermissionGate>
 *
 * @example
 * // With custom loading state
 * <PermissionGate
 *   permission="create_cost"
 *   projectId={projectId}
 *   loadingFallback={<Skeleton className="h-10 w-32" />}
 * >
 *   <Button>Add Cost</Button>
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  projectId,
  resourceId,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermission(
    permission,
    projectId,
    resourceId
  )

  if (isLoading) {
    return <>{loadingFallback}</>
  }

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Helper component for multiple permission checks with OR logic
 * Renders children if user has ANY of the specified permissions
 *
 * @example
 * <PermissionGateAny
 *   permissions={['edit_project', 'manage_team']}
 *   projectId={projectId}
 * >
 *   <SettingsButton />
 * </PermissionGateAny>
 */
interface PermissionGateAnyProps {
  /** List of permissions to check (OR logic) */
  permissions: Permission[]
  /** Project ID to check permissions for */
  projectId: string
  /** Content to render if user has any permission */
  children: ReactNode
  /** Optional content to render if user lacks all permissions */
  fallback?: ReactNode
  /** Optional loading state */
  loadingFallback?: ReactNode
}

export function PermissionGateAny({
  permissions,
  projectId,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateAnyProps) {
  // Check all permissions
  const permissionChecks = permissions.map((permission) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePermission(permission, projectId)
  )

  const isLoading = permissionChecks.some((check) => check.isLoading)
  const hasAnyPermission = permissionChecks.some((check) => check.hasPermission)

  if (isLoading) {
    return <>{loadingFallback}</>
  }

  if (!hasAnyPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Helper component for multiple permission checks with AND logic
 * Renders children if user has ALL of the specified permissions
 *
 * @example
 * <PermissionGateAll
 *   permissions={['view_budget', 'edit_budget']}
 *   projectId={projectId}
 * >
 *   <BudgetEditor />
 * </PermissionGateAll>
 */
interface PermissionGateAllProps {
  /** List of permissions to check (AND logic) */
  permissions: Permission[]
  /** Project ID to check permissions for */
  projectId: string
  /** Content to render if user has all permissions */
  children: ReactNode
  /** Optional content to render if user lacks any permission */
  fallback?: ReactNode
  /** Optional loading state */
  loadingFallback?: ReactNode
}

export function PermissionGateAll({
  permissions,
  projectId,
  children,
  fallback = null,
  loadingFallback = null,
}: PermissionGateAllProps) {
  // Check all permissions
  const permissionChecks = permissions.map((permission) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    usePermission(permission, projectId)
  )

  const isLoading = permissionChecks.some((check) => check.isLoading)
  const hasAllPermissions = permissionChecks.every((check) => check.hasPermission)

  if (isLoading) {
    return <>{loadingFallback}</>
  }

  if (!hasAllPermissions) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
