/**
 * RFI Message Component
 *
 * Displays a message in an RFI conversation thread
 */

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RFIMessageAttachment {
  id: string
  file_name: string
  file_size: number
  file_type: string
}

interface RFIMessageProps {
  message: {
    id: string
    content: string
    created_at: string
    is_official_answer?: boolean
    author?: {
      id: string
      full_name: string | null
      email: string
      avatar_url?: string | null
    } | null
    attachments?: RFIMessageAttachment[]
  }
  isOriginalQuestion?: boolean
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function RFIMessage({ message, isOriginalQuestion = false }: RFIMessageProps) {
  const author = message.author || {
    full_name: null,
    email: 'Unknown',
    avatar_url: null,
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-6',
        message.is_official_answer && 'border-green-200 bg-green-50/50',
        isOriginalQuestion && 'border-blue-200 bg-blue-50/50'
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar_url || undefined} />
            <AvatarFallback>
              {getInitials(author.full_name, author.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{author.full_name || author.email}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(message.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isOriginalQuestion && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              Original Question
            </Badge>
          )}
          {message.is_official_answer && (
            <Badge className="bg-green-600">Official Answer</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {message.content}
      </div>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Attachments ({message.attachments.length})
          </p>
          <div className="space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between rounded-md border bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
