'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, FileText, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { ProjectInvoice } from '@/lib/actions/invoices/get-project-invoices'

interface InvoiceListProps {
  invoices: ProjectInvoice[]
  projectId: string
}

export function InvoiceList({ invoices, projectId }: InvoiceListProps) {
  const { toast } = useToast()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownload = async (invoice: ProjectInvoice) => {
    setDownloadingId(invoice.id)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('project-invoices')
        .download(invoice.file_path)

      if (error) {
        throw error
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = invoice.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'rejected':
        return 'destructive'
      case 'paid':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'labor':
        return 'bg-blue-100 text-blue-800'
      case 'materials':
        return 'bg-green-100 text-green-800'
      case 'equipment':
        return 'bg-purple-100 text-purple-800'
      case 'other':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>View and download all project invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-neutral-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
            <p>No invoices uploaded yet.</p>
            <p className="text-sm mt-1">Upload your first invoice to get started.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>
          {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'} uploaded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                  <p className="font-medium text-neutral-900 truncate">
                    {invoice.vendor_name || 'Unknown Vendor'}
                  </p>
                  {invoice.ai_parsed && (
                    <Sparkles className="h-4 w-4 text-green-500 flex-shrink-0" aria-label="AI Extracted" />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                  {invoice.invoice_number && (
                    <span className="text-xs">#{invoice.invoice_number}</span>
                  )}
                  {invoice.invoice_date && (
                    <span className="text-xs">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </span>
                  )}
                  <Badge className={getCategoryColor(invoice.budget_category)} variant="secondary">
                    {invoice.budget_category}
                  </Badge>
                  <Badge variant={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>

                {invoice.ai_confidence !== null && invoice.ai_confidence !== undefined && (
                  <p className="text-xs text-neutral-500 mt-1">
                    AI Confidence: {(invoice.ai_confidence * 100).toFixed(0)}%
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 ml-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-neutral-900">
                    ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(invoice)}
                  disabled={downloadingId === invoice.id}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Total Invoices</p>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Total Amount</p>
              <p className="text-2xl font-bold">
                ${invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
