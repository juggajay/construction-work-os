'use client'

/**
 * Line Items Table Component
 * Display and manage budget line items
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  getLineItems,
  updateLineItem,
  deleteLineItem,
  addManualLineItem,
} from '@/lib/actions/budgets'
import { Loader2, Trash2, Plus, FileText, Edit2, Save, X } from 'lucide-react'
import type { Database } from '@/lib/types/supabase'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

interface LineItem {
  id: string
  line_number: number | null
  description: string
  quantity: number | null
  unit_of_measure: string | null
  unit_price: number | null
  line_total: number
  ai_confidence: number | null
  quote_file_name: string | null
  quote_id: string | null
}

interface LineItemsTableProps {
  budgetId: string
  category: BudgetCategory
  canEdit?: boolean
  onUpdate?: () => void
}

export function LineItemsTable({
  budgetId,
  category,
  canEdit = false,
  onUpdate,
}: LineItemsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<LineItem | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Manual line item form state
  const [manualForm, setManualForm] = useState({
    description: '',
    quantity: '',
    unit_of_measure: '',
    unit_price: '',
    line_total: '',
  })

  useEffect(() => {
    loadLineItems()
  }, [budgetId])

  const loadLineItems = async () => {
    setLoading(true)
    setError(null)

    const result = await getLineItems({ budgetId })

    if (result.success && result.data) {
      setLineItems(result.data.lineItems as unknown as LineItem[])
    } else {
      setError('error' in result ? result.error : 'Failed to load line items')
    }

    setLoading(false)
  }

  const startEdit = (item: LineItem) => {
    setEditingId(item.id)
    setEditingItem({ ...item })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingItem(null)
  }

  const updateEditingField = (field: keyof LineItem, value: any) => {
    if (!editingItem) return

    const updated = { ...editingItem, [field]: value }

    // Recalculate line_total if quantity or unit_price changed
    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? value : updated.quantity
      const price = field === 'unit_price' ? value : updated.unit_price
      if (qty !== null && price !== null) {
        updated.line_total = qty * price
      }
    }

    setEditingItem(updated)
  }

  const saveEdit = async () => {
    if (!editingItem) return

    startTransition(async () => {
      const result = await updateLineItem({
        lineItemId: editingItem.id,
        description: editingItem.description,
        quantity: editingItem.quantity,
        unit_of_measure: editingItem.unit_of_measure,
        unit_price: editingItem.unit_price,
        line_total: editingItem.line_total,
      })

      if (result.success) {
        await loadLineItems()
        setEditingId(null)
        setEditingItem(null)
        onUpdate?.()
      } else {
        setError('error' in result ? result.error : 'Failed to update line item')
      }
    })
  }

  const handleDelete = async (lineItemId: string) => {
    if (!confirm('Are you sure you want to delete this line item?')) return

    startTransition(async () => {
      const result = await deleteLineItem({ lineItemId })

      if (result.success) {
        await loadLineItems()
        onUpdate?.()
      } else {
        setError('error' in result ? result.error : 'Failed to delete line item')
      }
    })
  }

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Calculate line_total if not provided
    let lineTotal = parseFloat(manualForm.line_total)
    if (!lineTotal && manualForm.quantity && manualForm.unit_price) {
      lineTotal = parseFloat(manualForm.quantity) * parseFloat(manualForm.unit_price)
    }

    if (!manualForm.description || !lineTotal) {
      setError('Description and total amount are required')
      return
    }

    startTransition(async () => {
      const result = await addManualLineItem({
        budgetId,
        description: manualForm.description,
        quantity: manualForm.quantity ? parseFloat(manualForm.quantity) : null,
        unit_of_measure: manualForm.unit_of_measure || null,
        unit_price: manualForm.unit_price ? parseFloat(manualForm.unit_price) : null,
        line_total: lineTotal,
      })

      if (result.success) {
        setShowAddDialog(false)
        setManualForm({
          description: '',
          quantity: '',
          unit_of_measure: '',
          unit_price: '',
          line_total: '',
        })
        await loadLineItems()
        onUpdate?.()
      } else {
        setError('error' in result ? result.error : 'Failed to add line item')
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Line Items</h3>
          <p className="text-sm text-muted-foreground">
            {lineItems.length} items • Total: ${lineItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2)}
          </p>
        </div>
        {canEdit && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Manual Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Line Item</DialogTitle>
                <DialogDescription>
                  Add a line item without uploading a quote document.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddManual} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={manualForm.description}
                    onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                    placeholder="Enter item description"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={manualForm.quantity}
                      onChange={(e) => setManualForm({ ...manualForm, quantity: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={manualForm.unit_of_measure}
                      onChange={(e) => setManualForm({ ...manualForm, unit_of_measure: e.target.value })}
                      placeholder="ea, ft, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Unit Price</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={manualForm.unit_price}
                      onChange={(e) => setManualForm({ ...manualForm, unit_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="line_total">Total *</Label>
                    <Input
                      id="line_total"
                      type="number"
                      step="0.01"
                      value={manualForm.line_total}
                      onChange={(e) => setManualForm({ ...manualForm, line_total: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && !showAddDialog && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {lineItems.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">No line items yet</p>
          <p className="text-xs mt-1">Upload a quote or add manual items to get started</p>
        </div>
      ) : (
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
                <TableHead className="w-32">Source</TableHead>
                {canEdit && <TableHead className="w-24">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => {
                const isEditing = editingId === item.id
                const displayItem = isEditing && editingItem ? editingItem : item
                const isAI = item.ai_confidence !== null

                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.line_number}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={displayItem.description}
                          onChange={(e) => updateEditingField('description', e.target.value)}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm">{item.description}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={displayItem.quantity || ''}
                          onChange={(e) => updateEditingField('quantity', parseFloat(e.target.value) || null)}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm">{item.quantity?.toFixed(2) || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={displayItem.unit_of_measure || ''}
                          onChange={(e) => updateEditingField('unit_of_measure', e.target.value || null)}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm">{item.unit_of_measure || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={displayItem.unit_price || ''}
                          onChange={(e) => updateEditingField('unit_price', parseFloat(e.target.value) || null)}
                          className="text-sm"
                        />
                      ) : (
                        <span className="text-sm">${item.unit_price?.toFixed(2) || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${displayItem.line_total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {item.quote_file_name ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{item.quote_file_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Manual</span>
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={saveEdit}
                              disabled={isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              disabled={isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(item)}
                              disabled={isPending}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              disabled={isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
