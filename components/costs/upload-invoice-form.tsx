'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseInvoiceWithAIAction } from '@/lib/actions/invoices'
import { uploadInvoice } from '@/lib/actions/invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Upload, Loader2, FileText, Sparkles } from 'lucide-react'

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
  const [isParsing, setIsParsing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any>(null)

  const [formData, setFormData] = useState({
    category: '',
    vendorName: '',
    invoiceNumber: '',
    invoiceDate: '',
    amount: '',
    description: '',
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setParsedData(null)

    // Auto-parse with AI
    setIsParsing(true)
    try {
      const result = await parseInvoiceWithAIAction({ projectId, file })

      if (result.success && result.data) {
        setParsedData(result.data)
        setFormData({
          category: formData.category, // Keep selected category
          vendorName: result.data.vendorName,
          invoiceNumber: result.data.invoiceNumber,
          invoiceDate: result.data.invoiceDate,
          amount: result.data.amount.toString(),
          description: result.data.description,
        })
        toast({
          title: 'Invoice Parsed!',
          description: 'AI successfully extracted invoice data. Please review and edit if needed.',
        })
      } else {
        toast({
          title: 'Parsing Failed',
          description: !result.success ? result.error : 'Could not parse invoice. Please enter data manually.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse invoice',
        variant: 'destructive',
      })
    } finally {
      setIsParsing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast({ title: 'Error', description: 'Please select a file', variant: 'destructive' })
      return
    }

    if (!formData.category) {
      toast({ title: 'Error', description: 'Please select a category', variant: 'destructive' })
      return
    }

    const amount = parseFloat(formData.amount)
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount greater than 0', variant: 'destructive' })
      return
    }

    setIsUploading(true)
    console.log('📤 Form: Starting invoice upload...')

    try {
      // Create FormData to send file
      const data = new FormData()
      data.append('projectId', projectId)
      data.append('category', formData.category)
      data.append('file', selectedFile)
      data.append('vendorName', formData.vendorName || '')
      data.append('invoiceNumber', formData.invoiceNumber || '')
      data.append('invoiceDate', formData.invoiceDate || '')
      data.append('amount', amount.toString())
      data.append('description', formData.description || '')

      console.log('📤 Form: Calling uploadInvoice server action...')
      const result = await uploadInvoice(data)
      console.log('📤 Form: Server action response:', result)

      if (result.success) {
        console.log('✅ Form: Upload successful, navigating to costs page')
        toast({ title: 'Success', description: 'Invoice uploaded successfully' })
        router.push(`/${orgSlug}/projects/${projectId}/costs`)
        router.refresh()
      } else {
        console.error('❌ Form: Upload failed:', result.error)
        toast({ title: 'Error', description: result.error || 'Failed to upload invoice', variant: 'destructive' })
      }
    } catch (error) {
      console.error('❌ Form: Unexpected error:', error)
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' })
    } finally {
      console.log('📤 Form: Upload process finished')
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="file">
          Invoice File <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center gap-4">
          <Input
            id="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.heic"
            onChange={handleFileSelect}
            disabled={isParsing || isUploading}
          />
          {isParsing && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
          {parsedData && <Sparkles className="h-5 w-5 text-green-500" />}
        </div>
        {selectedFile && (
          <p className="text-sm text-neutral-500 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {parsedData && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI extracted this data. Please review and edit if needed.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vendorName">Vendor Name</Label>
          <Input
            id="vendorName"
            value={formData.vendorName}
            onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
            placeholder="Vendor or supplier name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number</Label>
          <Input
            id="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            placeholder="INV-12345"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="invoiceDate">Invoice Date</Label>
          <Input
            id="invoiceDate"
            type="date"
            value={formData.invoiceDate}
            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
          />
        </div>

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
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="pl-7"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the invoice..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${orgSlug}/projects/${projectId}/costs`)}
          disabled={isParsing || isUploading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isParsing || isUploading || !selectedFile || !formData.amount || !formData.category}>
          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading ? 'Uploading...' : 'Upload Invoice'}
        </Button>
      </div>
    </form>
  )
}
