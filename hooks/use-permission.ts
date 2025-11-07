/**
 * Permission Hooks
 * React hooks for checking user permissions in client components
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { Permission } from '@/lib/permissions'

interface UsePermissionOptions {
  enabled?: boolean
  staleTime?: number
}

/**
 * Hook to check a single permission
 *
 * @param permission - Permission to check
 * @param projectId - Project ID to check permission for
 * @param resourceId - Optional resource ID for ownership checks
 * @param options - Query options
 *
 * @example
 * function EditBudgetButton({ projectId }: { projectId: string }) {
 *   const { hasPermission, isLoading } = usePermission('edit_budget', projectId)
 *
 *   if (isLoading) return <Skeleton />
 *   if (!hasPermission) return null
 *
 *   return <Button>Edit Budget</Button>
 * }
 */
export function usePermission(
  permission: Permission,
  projectId: string,
  resourceId?: string,
  options: UsePermissionOptions = {}
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['permission', permission, projectId, resourceId],
    queryFn: async () => {
      const params = new URLSearchParams({
        permission,
        projectId,
      })

      if (resourceId) {
        params.append('resourceId', resourceId)
      }

      const response = await fetch(`/api/permissions/check?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Permission check failed')
      }

      return response.json()
    },
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Cache for 5 minutes
    enabled: options.enabled !== false,
  })

  return {
    hasPermission: data?.allowed === true,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get all permissions for a project
 * More efficient than multiple usePermission calls
 *
 * @param projectId - Project ID to check permissions for
 * @param options - Query options
 *
 * @example
 * function ProjectActions({ projectId }: { projectId: string }) {
 *   const { permissions, can, isLoading } = usePermissions(projectId)
 *
 *   if (isLoading) return <Skeleton />
 *
 *   return (
 *     <div>
 *       {can('edit_budget') && <Button>Edit Budget</Button>}
 *       {can('create_cost') && <Button>Add Cost</Button>}
 *       {can('manage_team') && <Button>Manage Team</Button>}
 *     </div>
 *   )
 * }
 */
export function usePermissions(
  projectId: string,
  options: UsePermissionOptions = {}
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['permissions', projectId],
    queryFn: async () => {
      const response = await fetch(
        `/api/permissions?projectId=${encodeURIComponent(projectId)}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch permissions')
      }

      return response.json()
    },
    staleTime: options.staleTime ?? 5 * 60 * 1000, // Cache for 5 minutes
    enabled: options.enabled !== false,
  })

  const permissions = new Set<Permission>(data?.permissions || [])

  return {
    permissions,
    can: (permission: Permission) => permissions.has(permission),
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to check multiple specific permissions
 * Useful when you need to check 2-3 permissions but not all
 *
 * @param projectId - Project ID to check permissions for
 * @param permissionsToCheck - Array of permissions to check
 * @param options - Query options
 *
 * @example
 * function BudgetControls({ projectId }: { projectId: string }) {
 *   const { can, isLoading } = useMultiplePermissions(
 *     projectId,
 *     ['edit_budget', 'view_budget']
 *   )
 *
 *   if (isLoading) return <Skeleton />
 *
 *   return (
 *     <div>
 *       {can('view_budget') && <BudgetDisplay />}
 *       {can('edit_budget') && <BudgetEditor />}
 *     </div>
 *   )
 * }
 */
export function useMultiplePermissions(
  projectId: string,
  permissionsToCheck: Permission[],
  options: UsePermissionOptions = {}
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['multiplePermissions', projectId, permissionsToCheck],
    queryFn: async () => {
      // Check each permission in parallel
      const checks = await Promise.all(
        permissionsToCheck.map(async (permission) => {
          const params = new URLSearchParams({
            permission,
            projectId,
          })

          const response = await fetch(
            `/api/permissions/check?${params.toString()}`
          )

          if (!response.ok) {
            return { permission, allowed: false }
          }

          const result = await response.json()
          return { permission, allowed: result.allowed }
        })
      )

      return checks.reduce(
        (acc, check) => {
          acc[check.permission] = check.allowed
          return acc
        },
        {} as Record<Permission, boolean>
      )
    },
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    enabled: options.enabled !== false,
  })

  return {
    permissions: data || {},
    can: (permission: Permission) => data?.[permission] === true,
    isLoading,
    error,
    refetch,
  }
}
