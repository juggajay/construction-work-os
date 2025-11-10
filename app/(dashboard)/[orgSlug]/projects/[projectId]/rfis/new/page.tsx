/**
 * Create New RFI Page
 * ✅ PHASE 3B OPTIMIZATION: Dynamic import for RFIForm (226 lines)
 */

'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

const RFIForm = dynamic(
  () => import('@/components/rfis/rfi-form').then((mod) => ({ default: mod.RFIForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading form...</p>
        </div>
      </div>
    ),
  }
)

export default function NewRFIPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const orgSlug = params.orgSlug as string

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New RFI</h1>
        <p className="text-muted-foreground">
          Submit a new Request for Information
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <RFIForm projectId={projectId} orgSlug={orgSlug} />
      </div>
    </div>
  )
}
