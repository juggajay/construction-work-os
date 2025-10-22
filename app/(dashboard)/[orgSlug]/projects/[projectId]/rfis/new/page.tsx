/**
 * Create New RFI Page
 */

'use client'

import { useParams } from 'next/navigation'
import { RFIForm } from '@/components/rfis/rfi-form'

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
