/**
 * Invoice List - Industrial Luxury Dark Theme
 */

'use client'

import { cn } from '@/lib/utils'
import { Eye, Sparkles, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { InvoiceWithUploader } from '@/lib/actions/project-health'

interface InvoiceListProps {
  invoices: InvoiceWithUploader[]
}

const statusStyles: Record<string, string> = {
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
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

  if (invoices.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-12 rounded-lg",
        "border border-dashed border-white/[0.08]"
      )}>
        <FileText className="h-8 w-8 text-white/20 mb-3" />
        <p className="text-sm text-white/40">No invoices uploaded for this project yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/[0.06] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Vendor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Invoice #</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Uploaded By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Upload Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{invoice.vendor_name || 'Unknown Vendor'}</span>
                    {invoice.ai_parsed && (
                      <div className="flex items-center gap-1 text-[10px] text-purple-400">
                        <Sparkles className="h-3 w-3" />
                        <span>{invoice.ai_confidence ? `${(invoice.ai_confidence * 100).toFixed(0)}%` : 'AI'}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-sm text-white/70">
                  {invoice.invoice_number || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-white/70">
                  {invoice.invoice_date
                    ? new Date(invoice.invoice_date).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="px-4 py-3 font-semibold text-white">
                  ${invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase border",
                    "bg-white/[0.05] text-white/60 border-white/[0.1]"
                  )}>
                    {invoice.budget_category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase border",
                    statusStyles[invoice.status] || "bg-white/[0.05] text-white/60 border-white/[0.1]"
                  )}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">
                      {invoice.uploader_name || 'Unknown'}
                    </span>
                    {invoice.uploader_email && (
                      <span className="text-xs text-white/40">{invoice.uploader_email}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-white/50">
                  {new Date(invoice.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleView(invoice.file_path)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      "text-white/40 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
