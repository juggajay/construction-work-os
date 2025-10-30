/**
 * RFI Detail Page
 *
 * Displays RFI details, responses, attachments, and actions
 */

'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RFIStatusBadge, type RFIStatus } from '@/components/rfis/rfi-status-badge'
import { ResponseForm } from '@/components/rfis/response-form'
import { RFIMessage } from '@/components/rfis/rfi-message'
import { RFISidebar } from '@/components/rfis/rfi-sidebar'
import { getBallInCourt } from '@/lib/rfis/ball-in-court'
import { isOverdue } from '@/lib/rfis/sla-calculations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer, Forward, Reply } from 'lucide-react'

export default function RFIDetailPage() {
  const params = useParams()
  const rfiId = params.rfiId as string
  const queryClient = useQueryClient()
  const [showResponseForm, setShowResponseForm] = useState(false)

  // Fetch RFI with responses and attachments
  const { data: rfi, isLoading } = useQuery({
    queryKey: ['rfi', rfiId],
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('rfis')
        .select(`
          *,
          project:projects!inner (
            id,
            name
          ),
          creator:profiles!created_by (
            id,
            full_name,
            email
          ),
          assigned_to:profiles!assigned_to_id (
            id,
            full_name,
            email
          ),
          responses:rfi_responses (
            id,
            content,
            is_official_answer,
            created_at,
            author:profiles!author_id (
              id,
              full_name,
              email
            )
          ),
          attachments:rfi_attachments (
            id,
            file_name,
            file_size,
            file_type,
            created_at,
            uploaded_by:profiles!uploaded_by (
              id,
              full_name
            )
          )
        `)
        .eq('id', rfiId)
        .single()

      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading RFI...</div>
      </div>
    )
  }

  if (!rfi) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">RFI Not Found</h2>
          <p className="text-muted-foreground">The requested RFI could not be found.</p>
        </div>
      </div>
    )
  }

  const ballInCourt = getBallInCourt({
    status: (rfi as any).status,
    created_by: (rfi as any).created_by,
    assigned_to_id: (rfi as any).assigned_to_id,
    assigned_to_org: (rfi as any).assigned_to_org,
  })

  const rfiIsOverdue = isOverdue({
    status: (rfi as any).status,
    submitted_at: (rfi as any).submitted_at,
    response_due_date: (rfi as any).response_due_date,
    answered_at: (rfi as any).answered_at,
    closed_at: (rfi as any).closed_at,
  })

  // Sort responses by date
  const sortedResponses = (rfi as any).responses?.sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Create a message for the original RFI question
  const originalMessage = {
    id: 'original',
    content: (rfi as any).description,
    created_at: (rfi as any).created_at,
    author: (rfi as any).creator,
  }

  return (
    <div className="min-h-screen flex">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">RFI #{(rfi as any).number}</h1>
              <RFIStatusBadge status={(rfi as any).status as RFIStatus} isOverdue={rfiIsOverdue} />
              {(rfi as any).priority === 'high' && (
                <Badge variant="destructive">High Priority</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{(rfi as any).title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
            <Button size="sm" onClick={() => setShowResponseForm(true)}>
              <Reply className="h-4 w-4 mr-2" />
              Respond
            </Button>
          </div>
        </div>

        {/* RFI Thread */}
        <Card>
          <CardHeader>
            <CardTitle>RFI Thread</CardTitle>
            <CardDescription>Conversation history for this RFI</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Original Question */}
            <RFIMessage message={originalMessage} isOriginalQuestion={true} />

            {/* Responses */}
            {sortedResponses && sortedResponses.length > 0 ? (
              sortedResponses.map((response: any) => (
                <RFIMessage key={response.id} message={response} />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No responses yet. Be the first to respond.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Response Form */}
        {(rfi as any).status !== 'closed' && (rfi as any).status !== 'cancelled' && (
          <Card>
            <CardHeader>
              <CardTitle>Add Response</CardTitle>
              <CardDescription>Provide an answer or additional information</CardDescription>
            </CardHeader>
            <CardContent>
              {showResponseForm ? (
                <ResponseForm
                  rfiId={rfiId}
                  onSuccess={() => {
                    setShowResponseForm(false)
                    queryClient.invalidateQueries({ queryKey: ['rfi', rfiId] })
                  }}
                  onCancel={() => setShowResponseForm(false)}
                />
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowResponseForm(true)}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Add Response
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <aside className="w-80 border-l p-6 space-y-6 bg-muted/10">
        <RFISidebar rfi={rfi as any} />
      </aside>
    </div>
  )
}
