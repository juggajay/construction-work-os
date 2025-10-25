/**
 * Create New Change Order Page
 */

'use client'

import { useParams } from 'next/navigation'
import { ChangeOrderForm } from '@/components/change-orders/change-order-form'

export default function NewChangeOrderPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const orgSlug = params.orgSlug as string

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Change Order
        </h1>
        <p className="text-muted-foreground">
          Document a new project change order
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ChangeOrderForm projectId={projectId} orgSlug={orgSlug} />
      </div>
    </div>
  )
}
