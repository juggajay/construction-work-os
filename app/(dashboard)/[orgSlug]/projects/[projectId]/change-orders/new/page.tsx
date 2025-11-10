/**
 * Create New Change Order Page
 * ✅ PHASE 3B OPTIMIZATION: Dynamic import for ChangeOrderForm (253 lines)
 */

'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

const ChangeOrderForm = dynamic(
  () => import('@/components/change-orders/change-order-form').then((mod) => ({ default: mod.ChangeOrderForm })),
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
