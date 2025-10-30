/**
 * RFI Sidebar Component
 *
 * Displays RFI metadata in the sidebar
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  User,
  Building2,
  FileText,
  DollarSign,
  AlertCircle,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RFISidebarProps {
  rfi: {
    id: string
    number: string
    status: string
    priority: string
    discipline?: string | null
    spec_section?: string | null
    drawing_reference?: string | null
    cost_impact?: number | null
    schedule_impact_days?: number | null
    response_due_date?: string | null
    submitted_at?: string | null
    created_at: string
    project?: {
      id: string
      name: string
      number?: string | null
    } | null
    assigned_to?: {
      id: string
      full_name: string | null
      email: string
      avatar_url?: string | null
    } | null
    creator?: {
      id: string
      full_name: string | null
      email: string
    } | null
    attachments?: Array<{
      id: string
      file_name: string
      file_size: number
      file_type: string
    }>
  }
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function getDaysOpen(submittedAt: string | null): number {
  if (!submittedAt) return 0

  const submitted = new Date(submittedAt)
  const now = new Date()
  const diffMs = now.getTime() - submitted.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  return diffDays
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function RFISidebar({ rfi }: RFISidebarProps) {
  const daysOpen = getDaysOpen(rfi.submitted_at || null)

  return (
    <div className="space-y-6">
      {/* Project Information */}
      {rfi.project && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{rfi.project.name}</p>
            {rfi.project.number && (
              <p className="text-sm text-muted-foreground">#{rfi.project.number}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ball in Court */}
      {rfi.assigned_to && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Ball in Court
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={rfi.assigned_to.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(rfi.assigned_to.full_name, rfi.assigned_to.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {rfi.assigned_to.full_name || rfi.assigned_to.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rfi.assigned_to.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RFI Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Priority */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Priority</p>
            <Badge
              variant={
                rfi.priority === 'high'
                  ? 'destructive'
                  : rfi.priority === 'medium'
                  ? 'default'
                  : 'secondary'
              }
              className="capitalize"
            >
              {rfi.priority}
            </Badge>
          </div>

          <Separator />

          {/* Due Date */}
          {rfi.response_due_date && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due Date
                </p>
                <p className="text-sm font-medium">
                  {new Date(rfi.response_due_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Days Open */}
          {daysOpen > 0 && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Days Open
                </p>
                <p
                  className={cn(
                    'text-sm font-medium',
                    daysOpen > 5 && 'text-danger'
                  )}
                >
                  {daysOpen} days
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Discipline */}
          {rfi.discipline && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Discipline</p>
                <p className="text-sm font-medium">{rfi.discipline}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Spec Section */}
          {rfi.spec_section && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Spec Section</p>
                <p className="text-sm font-medium">{rfi.spec_section}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Drawing Reference */}
          {rfi.drawing_reference && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Drawing Reference</p>
                <p className="text-sm font-medium">{rfi.drawing_reference}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Cost Impact */}
          {rfi.cost_impact !== null && rfi.cost_impact !== undefined && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Cost Impact
                </p>
                <p className="text-sm font-medium">
                  ${rfi.cost_impact.toLocaleString()}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Schedule Impact */}
          {rfi.schedule_impact_days !== null &&
            rfi.schedule_impact_days !== undefined && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Schedule Impact
                  </p>
                  <p className="text-sm font-medium">
                    {rfi.schedule_impact_days} days
                  </p>
                </div>
                <Separator />
              </>
            )}

          {/* Created By */}
          {rfi.creator && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Created By</p>
              <p className="text-sm font-medium">
                {rfi.creator.full_name || rfi.creator.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(rfi.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      {rfi.attachments && rfi.attachments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Attachments ({rfi.attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rfi.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {attachment.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                    <Download className="h-3 w-3" />
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
