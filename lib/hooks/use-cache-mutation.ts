/**
 * Cache Mutation Hook
 * Provides reusable mutation patterns with automatic cache invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getInvalidationKeys } from '@/lib/config/cache-config'
import type { CACHE_INVALIDATION } from '@/lib/config/cache-config'

interface UseCacheMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  invalidationKey: keyof typeof CACHE_INVALIDATION
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
}

/**
 * Wrapper around useMutation that automatically handles cache invalidation
 *
 * @example
 * const createProject = useCacheMutation({
 *   mutationFn: async (data) => await createProjectAction(data),
 *   invalidationKey: 'PROJECT_CREATED',
 *   onSuccess: (project) => {
 *     toast.success('Project created!')
 *     router.push(`/projects/${project.id}`)
 *   }
 * })
 *
 * // Then use it:
 * createProject.mutate(projectData)
 */
export function useCacheMutation<TData = unknown, TVariables = void>({
  mutationFn,
  invalidationKey,
  onSuccess,
  onError,
}: UseCacheMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Automatically invalidate related queries
      const keysToInvalidate = getInvalidationKeys(invalidationKey)

      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      // Call custom success handler
      onSuccess?.(data, variables)
    },
    onError: (error: Error, variables) => {
      // Call custom error handler
      onError?.(error, variables)
    },
  })
}

/**
 * Hook for optimistic updates
 * Updates the cache immediately before the mutation completes
 *
 * @example
 * const updateProject = useOptimisticMutation({
 *   mutationFn: updateProjectAction,
 *   queryKey: ['project', projectId],
 *   invalidationKey: 'PROJECT_UPDATED',
 *   updater: (old, newData) => ({ ...old, ...newData }),
 * })
 */
export function useOptimisticMutation<TData = unknown, TVariables = void, TQueryData = unknown>({
  mutationFn,
  queryKey,
  invalidationKey,
  updater,
  onSuccess,
  onError,
}: UseCacheMutationOptions<TData, TVariables> & {
  queryKey: readonly unknown[]
  updater: (oldData: TQueryData | undefined, variables: TVariables) => TQueryData
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    // Optimistically update the cache before mutation completes
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TQueryData>(queryKey)

      // Optimistically update to the new value
      queryClient.setQueryData<TQueryData>(
        queryKey,
        (old) => updater(old, variables)
      )

      // Return context with snapshot
      return { previousData }
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }

      onError?.(error, variables)
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      const keysToInvalidate = getInvalidationKeys(invalidationKey)
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      onSuccess?.(data, variables)
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
