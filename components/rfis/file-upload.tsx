/**
 * RFI File Upload Component
 *
 * Handles file uploads for RFIs with validation and progress tracking
 */

'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadAttachment } from '@/lib/actions/rfis/upload-attachment'
import { deleteAttachment } from '@/lib/actions/rfis/delete-attachment'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, X, FileText, Loader2 } from 'lucide-react'

interface FileUploadProps {
  rfiId: string
  existingAttachments?: any[]
  disabled?: boolean
  onUploadComplete?: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
]

export function FileUpload({
  rfiId,
  existingAttachments = [],
  disabled = false,
  onUploadComplete,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 10MB. ${file.name} is ${(file.size / 1024 / 1024).toFixed(2)}MB`
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type not allowed. Please upload PDF, JPG, PNG, DOCX, or XLSX files.`
    }

    return null
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      setUploadProgress(0)

      const supabase = createClient()

      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `rfis/${rfiId}/${fileName}`

      // Upload to Supabase Storage
      setUploadProgress(50)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files') // You may need to create this bucket
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload file')
        return
      }

      setUploadProgress(75)

      // Record attachment in database
      const result = await uploadAttachment({
        rfiId,
        filePath,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to record attachment')
        // Clean up uploaded file
        await supabase.storage.from('files').remove([filePath])
        return
      }

      setUploadProgress(100)
      toast.success(`${file.name} uploaded successfully`)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onUploadComplete?.()
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (attachmentId: string, filePath: string) => {
    try {
      setDeleting(attachmentId)

      const result = await deleteAttachment({ attachmentId })

      if (!result.success) {
        toast.error(result.error || 'Failed to delete attachment')
        return
      }

      // Delete from storage
      const supabase = createClient()
      await supabase.storage.from('files').remove([filePath])

      toast.success('Attachment deleted successfully')
      onUploadComplete?.()
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          PDF, JPG, PNG, DOCX, XLSX (max 10MB)
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground">
            {uploadProgress}% uploaded
          </p>
        </div>
      )}

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Attachments</p>
          {existingAttachments.map((attachment: any) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{attachment.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(attachment.file_size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(attachment.id, attachment.file_path)}
                  disabled={deleting === attachment.id}
                >
                  {deleting === attachment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
