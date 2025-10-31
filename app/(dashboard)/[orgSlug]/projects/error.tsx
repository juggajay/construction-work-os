'use client'

import { FeatureErrorBoundary } from '@/components/errors/feature-error-boundary'

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <FeatureErrorBoundary
      error={error}
      reset={reset}
      featureName="Projects"
      homeUrl="/dashboard"
    />
  )
}
