'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { logger } from '@/lib/utils/logger'

/**
 * Enhanced Query Provider with optimized caching configuration
 * Implements smart caching strategies to reduce unnecessary network requests
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each request to avoid sharing state
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ENHANCED: Optimized caching strategy
            // staleTime: How long data is considered fresh (no refetch needed)
            staleTime: 60_000, // 1 minute default

            // gcTime: How long inactive data stays in cache
            gcTime: 300_000, // 5 minutes (formerly cacheTime)

            // Refetch behavior
            refetchOnWindowFocus: false, // Don't refetch when user switches tabs
            refetchOnReconnect: true, // Do refetch when internet reconnects
            refetchOnMount: true, // Refetch when component mounts if stale

            // Retry configuration
            retry: 1, // Only retry failed queries once
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Network mode
            networkMode: 'online', // Only fetch when online
          },
          mutations: {
            // Mutation retry configuration
            retry: 0, // Don't retry mutations (user should retry manually)
            networkMode: 'online',

            // Global mutation callbacks for cache invalidation
            // Individual mutations can override these
            onSuccess: () => {
              // This can be used for global side effects
              // Individual mutations should handle their own invalidation
            },
            onError: (error) => {
              // Global error handling
              logger.error('Mutation failed', error as Error, {
                component: 'QueryProvider',
              })
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
        />
      )}
    </QueryClientProvider>
  )
}
