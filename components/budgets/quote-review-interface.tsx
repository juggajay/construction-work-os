'use client'

/**
 * Quote Review Interface Component
 * Review and edit AI-extracted line items before saving
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { confirmLineItems } from '@/lib/actions/budgets'
import { Loader2, Check, AlertCircle, Edit2 } from 'lucide-react'
import type { ParsedLineItem, ParsedQuoteData } from '@/lib/utils/parse-quote'

interface QuoteReviewInterfaceProps {
  quoteId: string
  budgetId: string
  parsedData: ParsedQuoteData
  onConfirmSuccess?: () => void
}

export function QuoteReviewInterface({
  quoteId,
  budgetId,
  parsedData,
  onConfirmSuccess,
}: QuoteReviewInterfaceProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [lineItems, setLineItems] = useState(parsedData.line_items)
  const [corrections, setCorrections] = useState<Record<string, any>>({})

  const updateLineItem = (index: number, field: keyof ParsedLineItem, value: any) => {
    const updated = [...lineItems]
    const original = { ...updated[index] }
    updated[index] = { ...updated[index], [field]: value } as ParsedLineItem

    // Recalculate line_total if quantity or unit_price changed
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? value : updated[index]?.quantity
      const price = field === 'unit_price' ? value : updated[index]?.unit_price
      if (qty !== null && price !== null && updated[index]) {
        updated[index]!.line_total = qty * price
      }
    }

    // Track corrections
    if (JSON.stringify(original) !== JSON.stringify(updated[index])) {
      setCorrections({
        ...corrections,
        [`line_${index + 1}`]: {
          original,
          edited: updated[index],
        },
      })
    }

    setLineItems(updated)
  }

  const handleConfirm = async () => {
    setError(null)
    startTransition(async () => {
      const result = await confirmLineItems({
        quoteId,
        budgetId,
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_of_measure: item.unit_of_measure,
          unit_price: item.unit_price,
          line_total: item.line_total,
          line_number: item.line_number,
          ai_confidence: item.confidence,
        })),
        corrections,
      })

      if (result.success) {
        onConfirmSuccess?.()
      } else {
        setError(result.error || 'Failed to save line items')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Review Extracted Line Items</h3>
          <p className="text-sm text-muted-foreground">
            {lineItems.length} items extracted • Overall confidence: {(parsedData.confidence * 100).toFixed(0)}%
          </p>
        </div>
        <Button onClick={handleConfirm} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Confirm & Save
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Quantity</TableHead>
              <TableHead className="w-20">Unit</TableHead>
              <TableHead className="w-28">Unit Price</TableHead>
              <TableHead className="w-28">Total</TableHead>
              <TableHead className="w-20">Conf.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item, index) => {
              const lowConfidence = item.confidence < 0.8
              return (
                <TableRow
                  key={index}
                  className={lowConfidence ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                >
                  <TableCell>{item.line_number}</TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || null)}
                      className="text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.unit_of_measure || ''}
                      onChange={(e) => updateLineItem(index, 'unit_of_measure', e.target.value || null)}
                      className="text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price || ''}
                      onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || null)}
                      className="text-sm"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    ${item.line_total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        lowConfidence
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      }`}
                    >
                      {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-muted rounded-lg">
        <span className="text-sm font-medium">Total</span>
        <span className="text-lg font-bold">
          ${lineItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)}
        </span>
      </div>
    </div>
  )
}
