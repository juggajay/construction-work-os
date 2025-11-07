'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { InvoiceWithUploader } from '@/lib/actions/project-health'

interface InvoiceListProps {
  invoices: InvoiceWithUploader[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const handleView = async (filePath: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('project-invoices').download(filePath)

    if (error) {
      console.error('Error viewing file:', error)
      return
    }

    // Open file in new tab
    const url = URL.createObjectURL(data)
    window.open(url, '_blank')

    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    return <Badge variant="outline">{category}</Badge>
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p>No invoices uploaded for this project yet.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{invoice.vendor_name || 'Unknown Vendor'}</span>
                  {invoice.ai_parsed && (
                    <div className="flex items-center gap-1 text-xs text-purple-600">
                      <Sparkles className="h-3 w-3" />
                      <span>{invoice.ai_confidence ? `${(invoice.ai_confidence * 100).toFixed(0)}%` : 'AI'}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {invoice.invoice_number || 'N/A'}
              </TableCell>
              <TableCell>
                {invoice.invoice_date
                  ? new Date(invoice.invoice_date).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell className="font-semibold">
                ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>{getCategoryBadge(invoice.budget_category)}</TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {invoice.uploader_name || 'Unknown'}
                  </span>
                  {invoice.uploader_email && (
                    <span className="text-xs text-neutral-500">{invoice.uploader_email}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-neutral-600">
                {new Date(invoice.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(invoice.file_path)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
