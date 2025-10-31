'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { parseInvoiceWithAIAction } from '@/lib/actions/invoices'
import { uploadInvoice } from '@/lib/actions/invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Upload, Loader2, Sparkles, FileText } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface UploadInvoiceFormProps {
  projectId: string
  orgSlug: string
}

const CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
] as const

export function UploadInvoiceForm({ projectId, orgSlug }: UploadInvoiceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isParsing, setIsParsing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const [aiMetadata, setAiMetadata] = useState<{ confidence?: number; rawResponse?: any } | null>(null)

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')

  // Prevent default drag behavior on the entire page
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // Prevent file from opening in browser when dropped outside drop zone
    window.addEventListener('dragover', preventDefaults)
    window.addEventListener('drop', preventDefaults)

    return () => {
      window.removeEventListener('dragover', preventDefaults)
      window.removeEventListener('drop', preventDefaults)
    }
  }, [])

  // Process file (used by both file input and drag-drop)
  const processFile = async (file: File) => {
    setSelectedFile(file)
    setParsedData(null)
    setAiMetadata(null)

    // Auto-parse with AI
    setIsParsing(true)
    logger.debug('Starting AI invoice parsing', {
      action: 'upload-invoice-form',
      projectId,
      fileName: file.name,
    })

    try {
      // TEMPORARY: PDF support disabled due to serverless compatibility
      // TODO: Implement browser-based PDF rendering or use external service
      if (file.type === 'application/pdf') {
        logger.warn('PDF upload attempted but not supported', {
          action: 'upload-invoice-form',
          fileName: file.name,
        })

        toast({
          title: 'PDF Not Supported',
          description: 'Please upload an image file (JPG, PNG, HEIC) instead. PDF support coming soon.',
          variant: 'destructive',
        })

        setIsParsing(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setSelectedFile(null)
        return
      }

      // Create FormData for server action
      const formData = new FormData()
      formData.append('projectId', projectId)
      formData.append('file', file)

      const result = await parseInvoiceWithAIAction(formData)

      if (result.success && result.data) {
        setParsedData(result.data)

        // Store AI metadata
        setAiMetadata({
          confidence: result.data.confidence,
          rawResponse: result.data.rawResponse,
        })

        // Pre-fill amount from AI extraction
        setAmount(result.data.amount.toString())

        logger.info('AI parsing successful', {
          action: 'upload-invoice-form',
          projectId,
          confidence: result.data.confidence,
          amount: result.data.amount,
        })

        toast({
          title: 'Invoice Parsed!',
          description: `AI extracted $${result.data.amount.toLocaleString()} from ${result.data.vendorName}`,
        })

        // Show confirmation modal
        setShowConfirmModal(true)
      } else {
        const errorMessage = 'error' in result ? result.error : 'Unknown error'
        logger.error('AI parsing failed', new Error(errorMessage), {
          action: 'upload-invoice-form',
          projectId,
          error: errorMessage,
        })

        toast({
          title: 'Parsing Failed',
          description: errorMessage || 'Could not parse invoice. Please try again or upload manually.',
          variant: 'destructive',
        })

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setSelectedFile(null)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Unexpected error during AI parsing', error as Error, {
        action: 'upload-invoice-form',
        projectId,
        errorDetails: errorMessage,
      })

      toast({
        title: 'Error',
        description: errorMessage || 'Failed to parse invoice. Please try again.',
        variant: 'destructive',
      })

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSelectedFile(null)
    } finally {
      setIsParsing(false)
    }
  }

  // File input handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔵 handleFileSelect fired', { filesLength: e.target.files?.length })
    const file = e.target.files?.[0]
    if (!file) {
      console.log('🔴 No file selected')
      return
    }
    console.log('🟢 File selected:', { name: file.name, type: file.type, size: file.size })
    await processFile(file)
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    console.log('🔵 handleDragEnter fired')
    e.preventDefault()
    e.stopPropagation()
    if (!isParsing) {
      console.log('🟢 Setting dragging to true')
      setIsDragging(true)
    } else {
      console.log('🔴 Blocked by isParsing')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging to false if we're leaving the drop zone entirely
    const target = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!target.contains(relatedTarget)) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    console.log('🔵 handleDrop fired')
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (isParsing) {
      console.log('🔴 Drop blocked by isParsing')
      return
    }

    const file = e.dataTransfer.files?.[0]
    console.log('🟢 File from drop:', { name: file?.name, type: file?.type, hasFile: !!file })

    if (!file) {
      console.log('🔴 No file in dataTransfer')
      return
    }

    // Validate file type (PDF temporarily disabled)
    const validTypes = ['.jpg', '.jpeg', '.png', '.heic']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validTypes.includes(fileExtension)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or HEIC file (PDF support coming soon)',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 25MB',
        variant: 'destructive',
      })
      return
    }

    await processFile(file)
  }

  const handleConfirm = async () => {
    if (!selectedFile) {
      toast({ title: 'Error', description: 'No file selected', variant: 'destructive' })
      return
    }

    if (!category) {
      toast({ title: 'Error', description: 'Please select a category', variant: 'destructive' })
      return
    }

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount greater than 0', variant: 'destructive' })
      return
    }

    setIsUploading(true)
    logger.debug('Starting invoice upload with auto-approval', {
      action: 'upload-invoice-form',
      projectId,
      category,
      amount: parsedAmount,
      fileName: selectedFile.name,
    })

    try {
      // Create FormData to send file
      const data = new FormData()
      data.append('projectId', projectId)
      data.append('category', category)
      data.append('file', selectedFile)
      data.append('amount', parsedAmount.toString())

      // Add AI-extracted data
      if (parsedData) {
        data.append('vendorName', parsedData.vendorName || '')
        data.append('invoiceNumber', parsedData.invoiceNumber || '')
        data.append('invoiceDate', parsedData.invoiceDate || '')
        data.append('description', parsedData.description || '')
      }

      // Add AI metadata
      if (aiMetadata) {
        data.append('aiParsed', 'true')
        if (aiMetadata.confidence !== undefined) {
          data.append('aiConfidence', aiMetadata.confidence.toString())
        }
        if (aiMetadata.rawResponse) {
          data.append('aiRawResponse', JSON.stringify(aiMetadata.rawResponse))
        }
      }

      // Auto-approve invoice for immediate budget deduction
      data.append('status', 'approved')

      logger.debug('Calling uploadInvoice server action', {
        action: 'upload-invoice-form',
        projectId,
        status: 'approved',
      })

      const result = await uploadInvoice(data)

      logger.debug('Server action response received', {
        action: 'upload-invoice-form',
        success: result.success,
      })

      if (result.success) {
        logger.info('Invoice upload successful (auto-approved)', {
          action: 'upload-invoice-form',
          projectId,
          category,
          amount: parsedAmount,
        })

        toast({
          title: 'Success!',
          description: `Invoice approved and $${parsedAmount.toLocaleString()} deducted from ${category} budget`,
        })

        // Close modal and redirect
        setShowConfirmModal(false)
        router.push(`/${orgSlug}/projects/${projectId}/costs`)
        router.refresh()
      } else {
        logger.error('Invoice upload failed', new Error(result.error || 'Unknown error'), {
          action: 'upload-invoice-form',
          projectId,
          error: result.error,
        })

        toast({
          title: 'Error',
          description: result.error || 'Failed to upload invoice',
          variant: 'destructive',
        })
      }
    } catch (error) {
      logger.error('Unexpected error during invoice upload', error as Error, {
        action: 'upload-invoice-form',
        projectId,
      })

      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      logger.debug('Invoice upload process finished', {
        action: 'upload-invoice-form',
        projectId,
      })
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmModal(false)
    setSelectedFile(null)
    setParsedData(null)
    setAiMetadata(null)
    setAmount('')
    setCategory('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      {/* Drag and Drop Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          flex flex-col items-center justify-center
          border-2 border-dashed rounded-lg p-12
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-neutral-300 hover:border-neutral-400'
          }
          ${isParsing ? 'cursor-not-allowed opacity-75' : ''}
        `}
        onClick={() => {
          console.log('🔵 Container onClick fired', { isParsing, hasRef: !!fileInputRef.current })
          if (!isParsing && fileInputRef.current) {
            console.log('🟢 Calling fileInputRef.current.click()')
            fileInputRef.current.click()
          } else {
            console.log('🔴 Click blocked:', { isParsing, hasRef: !!fileInputRef.current })
          }
        }}
      >
        <div className="flex flex-col items-center gap-4">
          {isParsing ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-lg font-medium text-neutral-700">AI is reading your invoice...</p>
              <p className="text-sm text-neutral-500">This may take a few seconds</p>
            </>
          ) : (
            <>
              <Upload className={`h-12 w-12 transition-colors ${isDragging ? 'text-blue-500' : 'text-neutral-400'}`} />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {isDragging ? 'Drop invoice here' : 'Upload Invoice'}
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  {isDragging
                    ? 'Release to upload and extract data'
                    : 'Drag and drop or click to browse'
                  }
                </p>
              </div>
              {!isDragging && (
                <>
                  <Button
                    type="button"
                    onClick={(e) => {
                      console.log('🔵 Button onClick fired', { hasRef: !!fileInputRef.current })
                      e.stopPropagation()
                      if (fileInputRef.current) {
                        console.log('🟢 Calling fileInputRef.current.click() from button')
                        fileInputRef.current.click()
                      } else {
                        console.log('🔴 No ref available')
                      }
                    }}
                    disabled={isParsing}
                    size="lg"
                    className="mt-2"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Invoice File
                  </Button>
                  <p className="text-xs text-neutral-400 mt-2">
                    Supports JPG, PNG, HEIC (max 25MB) • PDF coming soon
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.heic"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isParsing}
              />
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              Confirm Invoice Details
            </DialogTitle>
            <DialogDescription>
              AI extracted the following information. Review and confirm to approve.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Info */}
            {selectedFile && (
              <div className="rounded-lg bg-neutral-50 p-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-neutral-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-neutral-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}

            {/* Vendor Info (extracted but not editable) */}
            {parsedData && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-xs font-medium text-blue-900 mb-1">AI Extracted</p>
                <p className="text-sm text-blue-800">
                  <strong>Vendor:</strong> {parsedData.vendorName}
                </p>
                {parsedData.invoiceNumber && (
                  <p className="text-sm text-blue-800">
                    <strong>Invoice #:</strong> {parsedData.invoiceNumber}
                  </p>
                )}
                {parsedData.invoiceDate && (
                  <p className="text-sm text-blue-800">
                    <strong>Date:</strong> {new Date(parsedData.invoiceDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Amount (editable) */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Category (required) */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Budget Category <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory} disabled={isUploading}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">
                Amount will be deducted from this category&apos;s budget
              </p>
            </div>

            {/* AI Confidence */}
            {aiMetadata && aiMetadata.confidence !== undefined && (
              <div className="text-xs text-neutral-500">
                AI Confidence: {(aiMetadata.confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isUploading || !category || !amount}
            >
              {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUploading ? 'Approving...' : 'Confirm & Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
