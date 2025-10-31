'use client'

import { useState, useRef } from 'react'
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)
  const [aiMetadata, setAiMetadata] = useState<{ confidence?: number; rawResponse?: any } | null>(null)

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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
      const result = await parseInvoiceWithAIAction({ projectId, file })

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
      logger.error('Unexpected error during AI parsing', error as Error, {
        action: 'upload-invoice-form',
        projectId,
      })

      toast({
        title: 'Error',
        description: 'Failed to parse invoice. Please try again.',
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
      {/* Simple Upload Button */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 rounded-lg p-12 hover:border-neutral-400 transition-colors">
        <div className="flex flex-col items-center gap-4">
          {isParsing ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-lg font-medium text-neutral-700">AI is reading your invoice...</p>
              <p className="text-sm text-neutral-500">This may take a few seconds</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-neutral-400" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-neutral-900">Upload Invoice</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  AI will automatically extract amount and details
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                size="lg"
                className="mt-2"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Invoice File
              </Button>
              <p className="text-xs text-neutral-400 mt-2">
                Supports PDF, JPG, PNG, HEIC (max 25MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic"
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
                Amount will be deducted from this category's budget
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
