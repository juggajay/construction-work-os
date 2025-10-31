'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface FeatureErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  featureName?: string
  homeUrl?: string
}

/**
 * Feature-level error boundary component
 * Provides user-friendly error UI with recovery options
 * Used in error.tsx files throughout the application
 */
export function FeatureErrorBoundary({
  error,
  reset,
  featureName = 'this feature',
  homeUrl = '/dashboard',
}: FeatureErrorBoundaryProps) {
  useEffect(() => {
    // Log error to console in development
    // In production, this should send to error tracking service (Sentry, LogRocket, etc.)
    console.error(`[${featureName}] Error:`, error)
  }, [error, featureName])

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We encountered an error while loading {featureName}.
            {error.digest && (
              <span className="block mt-2 text-xs font-mono text-muted-foreground">
                Error ID: {error.digest}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error message (sanitized for security) */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground font-mono break-words">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>

          {/* Recovery actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = homeUrl}
              variant="outline"
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-center text-muted-foreground">
            If this problem persists, please contact support or try refreshing the page.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
