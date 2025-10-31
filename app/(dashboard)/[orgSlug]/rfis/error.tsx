'use client'

import { FeatureErrorBoundary } from '@/components/errors/feature-error-boundary'
import { useParams } from 'next/navigation'

export default function RFIsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  return (
    <FeatureErrorBoundary
      error={error}
      reset={reset}
      featureName="RFIs"
      homeUrl={`/${orgSlug}`}
    />
  )
}
