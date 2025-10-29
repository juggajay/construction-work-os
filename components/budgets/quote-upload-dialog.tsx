'use client'

/**
 * Quote Upload Dialog Component
 * Upload quote documents for budget allocations
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

import { useState, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { uploadQuote } from '@/lib/actions/budgets'
import { Upload, Loader2, FileUp, X } from 'lucide-react'
import type { Database } from '@/lib/types/supabase'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

interface QuoteUploadDialogProps {
  projectId: string
  category?: BudgetCategory | null
  onUploadSuccess?: (quoteId: string) => void
}

export function QuoteUploadDialog({
  projectId,
  category,
  onUploadSuccess,
}: QuoteUploadDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/jpg']
    if (!allowedTypes.includes(selectedFile.type.toLowerCase())) {
      setError('Invalid file type. Please upload PDF, JPEG, PNG, or HEIC.')
      return
    }

    // Validate file size (max 25MB)
    const maxSize = 26214400
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 25MB limit. Please upload a smaller file.')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!file) {
      setError('Please select a file to upload')
      return
    }

    startTransition(async () => {
      const result = await uploadQuote({
        projectId,
        category,
        file,
      })

      if (result.success && result.data) {
        setOpen(false)
        setFile(null)
        onUploadSuccess?.(result.data.quoteId)
      } else {
        setError('error' in result ? result.error : 'Failed to upload quote')
      }
    })
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} ` : ''}Quote Document</DialogTitle>
          <DialogDescription>
            Upload a quote PDF or image{category ? ` for ${category} budget` : ' for this project'}. AI will automatically extract line items for
            your review.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Quote File</Label>

            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.heic"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                  id="quote-file-input"
                  disabled={isPending}
                />
                <label htmlFor="quote-file-input" className="cursor-pointer">
                  <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, PNG, JPG, HEIC up to 25MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !file}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Parse
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
