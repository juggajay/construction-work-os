'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each request to avoid sharing state
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Performance optimized defaults
            staleTime: 60_000, // 1 minute - don't refetch for 1 min
            gcTime: 300_000, // 5 minutes - keep in cache for 5 min (formerly cacheTime)
            refetchOnWindowFocus: false, // Don't refetch on tab focus
            retry: 1, // Only retry failed queries once
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
