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
import { getBallInCourt } from '@/lib/rfis/ball-in-court'
import { isOverdue } from '@/lib/rfis/sla-calculations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Calendar, FileText, User } from 'lucide-react'

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{(rfi as any).number}</h1>
              <RFIStatusBadge status={(rfi as any).status as RFIStatus} isOverdue={rfiIsOverdue} />
            </div>
            <h2 className="text-xl text-muted-foreground">{(rfi as any).title}</h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">
            {(rfi as any).priority} Priority
          </Badge>
          {(rfi as any).discipline && <Badge variant="outline">{(rfi as any).discipline}</Badge>}
          {(rfi as any).spec_section && <Badge variant="outline">Spec: {(rfi as any).spec_section}</Badge>}
        </div>
      </div>

      {/* Ball in Court Alert */}
      {ballInCourt.isBlocked ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Action Required</p>
              <p className="text-sm text-yellow-700">{ballInCourt.suggestedAction}</p>
            </div>
          </div>
        </div>
      ) : ballInCourt.userId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Ball in Court</p>
              <p className="text-sm text-blue-700">{ballInCourt.suggestedAction}</p>
            </div>
          </div>
        </div>
      )}

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">Description</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">{(rfi as any).description}</p>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created By</p>
              <p>{(rfi as any).creator?.full_name || (rfi as any).creator?.email || 'Unknown'}</p>
            </div>

            {(rfi as any).assigned_to && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                <p>{(rfi as any).assigned_to.full_name || (rfi as any).assigned_to.email}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p>{new Date((rfi as any).created_at).toLocaleString()}</p>
            </div>

            {(rfi as any).response_due_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Due</p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date((rfi as any).response_due_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {(rfi as any).drawing_reference && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Drawing Reference</p>
                <p>{(rfi as any).drawing_reference}</p>
              </div>
            )}

            {(rfi as any).cost_impact !== null && (rfi as any).cost_impact !== undefined && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Impact</p>
                <p>${(rfi as any).cost_impact.toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Responses ({sortedResponses?.length || 0})</CardTitle>
          <CardDescription>Discussion thread for this RFI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedResponses && sortedResponses.length > 0 ? (
            sortedResponses.map((response: any) => (
              <div
                key={response.id}
                className={`rounded-lg border p-4 ${
                  response.is_official_answer ? 'border-green-200 bg-green-50' : ''
                }`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">
                      {response.author?.full_name || response.author?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(response.created_at).toLocaleString()}
                    </p>
                  </div>
                  {response.is_official_answer && (
                    <Badge className="bg-green-600">Official Answer</Badge>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{response.content}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">No responses yet.</p>
          )}

          {(rfi as any).status !== 'closed' && (rfi as any).status !== 'cancelled' && (
            <div className="pt-4">
              {showResponseForm ? (
                <div className="rounded-lg border p-4">
                  <ResponseForm
                    rfiId={rfiId}
                    onSuccess={() => {
                      setShowResponseForm(false)
                      queryClient.invalidateQueries({ queryKey: ['rfi', rfiId] })
                    }}
                    onCancel={() => setShowResponseForm(false)}
                  />
                </div>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowResponseForm(true)}
                >
                  Add Response
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      {(rfi as any).attachments && (rfi as any).attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attachments ({(rfi as any).attachments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(rfi as any).attachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{attachment.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(attachment.file_size / 1024).toFixed(1)} KB • Uploaded by{' '}
                        {attachment.uploaded_by?.full_name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
