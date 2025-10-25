/**
 * Change Order Detail Page
 *
 * Displays change order details, line items, approval workflow, and version history
 */

'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChangeOrderStatusBadge } from '@/components/change-orders/change-order-status-badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Calendar,
  FileText,
  User,
  DollarSign,
  Clock,
} from 'lucide-react'
import type { ChangeOrderStatus } from '@/lib/types'

export default function ChangeOrderDetailPage() {
  const params = useParams()
  const changeOrderId = params.changeOrderId as string

  // Fetch Change Order with line items and approvals
  // TODO: Re-enable user/profile data after verifying foreign keys in remote database
  const { data: changeOrder, isLoading } = useQuery({
    queryKey: ['change-order', changeOrderId],
    queryFn: async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('change_orders')
        .select(
          `
          *,
          project:projects!inner (
            id,
            name
          ),
          line_items:change_order_line_items (
            id,
            description,
            quantity,
            unit,
            unit_cost,
            sub_cost,
            gc_markup_percent,
            gc_markup_amount,
            extended_cost,
            tax_rate,
            tax_amount,
            total_amount,
            csi_section,
            sort_order,
            version
          ),
          approvals:change_order_approvals (
            id,
            stage,
            status,
            approver_id,
            decision_at,
            notes,
            created_at,
            version
          ),
          versions:change_order_versions (
            id,
            version_number,
            created_at,
            created_by,
            reason
          ),
          attachments:change_order_attachments (
            id,
            file_name,
            file_size,
            file_type,
            category,
            created_at
          )
        `
        )
        .eq('id', changeOrderId)
        .single()

      if (error) throw error
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading change order...</div>
      </div>
    )
  }

  if (!changeOrder) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Change Order Not Found</h2>
          <p className="text-muted-foreground">
            The requested change order could not be found.
          </p>
        </div>
      </div>
    )
  }

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num)
  }

  // Format type for display
  const formatType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Filter line items for current version
  const currentLineItems =
    (changeOrder as any).line_items?.filter(
      (item: any) => item.version === (changeOrder as any).current_version
    ) || []

  // Sort line items by sort_order
  const sortedLineItems = currentLineItems.sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  )

  // Calculate total cost
  const totalCost = sortedLineItems.reduce(
    (sum: number, item: any) => sum + parseFloat(item.total_amount || '0'),
    0
  )

  // Get current approvals for current version
  const currentApprovals =
    (changeOrder as any).approvals?.filter(
      (approval: any) =>
        approval.version === (changeOrder as any).current_version
    ) || []

  // Sort approvals by stage order
  const stageOrder = ['gc_review', 'owner_approval', 'architect_approval']
  const sortedApprovals = currentApprovals.sort(
    (a: any, b: any) =>
      stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage)
  )

  // Format approval stage
  const formatApprovalStage = (stage: string) => {
    const stageMap: Record<string, string> = {
      gc_review: 'GC Review',
      owner_approval: 'Owner Approval',
      architect_approval: 'Architect Approval',
    }
    return stageMap[stage] || stage
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {(changeOrder as any).number}
              </h1>
              <ChangeOrderStatusBadge
                status={(changeOrder as any).status as ChangeOrderStatus}
              />
            </div>
            <h2 className="text-xl text-muted-foreground">
              {(changeOrder as any).title}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {formatType((changeOrder as any).type)}
          </Badge>
          {(changeOrder as any).current_version > 1 && (
            <Badge variant="outline">
              Version {(changeOrder as any).current_version}
            </Badge>
          )}
        </div>
      </div>

      {/* Cost & Schedule Impact Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Cost Impact
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency((changeOrder as any).cost_impact || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Schedule Impact
                </p>
                <p className="text-2xl font-bold">
                  {(changeOrder as any).schedule_impact_days || 0} days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(changeOrder as any).description && (
            <>
              <div>
                <h3 className="mb-2 font-semibold">Description</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {(changeOrder as any).description}
                </p>
              </div>
              <Separator />
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created By
              </p>
              <p>
                {(changeOrder as any).created_by || 'Unknown'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created
              </p>
              <p>
                {new Date((changeOrder as any).created_at).toLocaleString()}
              </p>
            </div>

            {(changeOrder as any).submitted_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Submitted
                </p>
                <p>
                  {new Date((changeOrder as any).submitted_at).toLocaleString()}
                </p>
              </div>
            )}

            {(changeOrder as any).approved_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Approved
                </p>
                <p>
                  {new Date((changeOrder as any).approved_at).toLocaleString()}
                </p>
              </div>
            )}

            {(changeOrder as any).new_completion_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  New Completion Date
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(
                    (changeOrder as any).new_completion_date
                  ).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items ({sortedLineItems.length})</CardTitle>
          <CardDescription>Cost breakdown for this change order</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedLineItems.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Extended</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLineItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          {item.csi_section && (
                            <p className="text-sm text-muted-foreground">
                              CSI {item.csi_section}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(item.quantity).toFixed(2)} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.extended_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.tax_amount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="text-right font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold">
                      {formatCurrency(totalCost)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No line items yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Approval Workflow */}
      {sortedApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Approval Workflow</CardTitle>
            <CardDescription>Current approval status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedApprovals.map((approval: any, index: number) => (
                <div key={approval.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {approval.status === 'approved' ? (
                        <div className="h-6 w-6 rounded-full bg-green-600" />
                      ) : approval.status === 'rejected' ? (
                        <div className="h-6 w-6 rounded-full bg-red-600" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {formatApprovalStage(approval.stage)}
                        </p>
                        <Badge
                          variant={
                            approval.status === 'approved'
                              ? 'default'
                              : approval.status === 'rejected'
                                ? 'destructive'
                                : 'outline'
                          }
                          className={
                            approval.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : approval.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : ''
                          }
                        >
                          {approval.status === 'approved'
                            ? 'Approved'
                            : approval.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending'}
                        </Badge>
                      </div>
                      {approval.decision_at && (
                        <p className="text-sm text-muted-foreground">
                          {approval.approver_id || 'Unknown'} on{' '}
                          {new Date(approval.decision_at).toLocaleString()}
                        </p>
                      )}
                      {approval.notes && (
                        <p className="mt-1 text-sm">{approval.notes}</p>
                      )}
                    </div>
                  </div>
                  {index < sortedApprovals.length - 1 && (
                    <div className="ml-5 mt-2 h-6 w-0.5 bg-muted" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Version History */}
      {(changeOrder as any).versions &&
        (changeOrder as any).versions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Version History ({(changeOrder as any).versions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(changeOrder as any).versions.map((version: any) => (
                  <div key={version.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          Version {version.version_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {version.created_by || 'Unknown'} on{' '}
                          {new Date(version.created_at).toLocaleString()}
                        </p>
                        {version.reason && (
                          <p className="mt-1 text-sm">{version.reason}</p>
                        )}
                      </div>
                      {version.version_number ===
                        (changeOrder as any).current_version && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Attachments */}
      {(changeOrder as any).attachments &&
        (changeOrder as any).attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Attachments ({(changeOrder as any).attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(changeOrder as any).attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{attachment.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(attachment.file_size / 1024).toFixed(1)} KB •{' '}
                          {attachment.category}
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
