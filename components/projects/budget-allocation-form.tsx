'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateBudgetAllocation } from '@/lib/actions/budgets'
import { getBudgetBreakdown } from '@/lib/actions/budgets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { DollarSign, ChevronDown, ChevronRight } from 'lucide-react'
import { QuoteUploadDialog } from '@/components/budgets/quote-upload-dialog'
import { LineItemsTable } from '@/components/budgets/line-items-table'
import type { Database } from '@/lib/types/supabase'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

interface BudgetAllocationFormProps {
  projectId: string
  totalBudget: number
}

const CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
] as const

export function BudgetAllocationForm({ projectId, totalBudget }: BudgetAllocationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const [allocations, setAllocations] = useState({
    labor: '',
    materials: '',
    equipment: '',
    other: '',
  })
  const [budgetIds, setBudgetIds] = useState<Record<string, string>>({})
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [reason, setReason] = useState('')

  // Fetch existing allocations
  useEffect(() => {
    const fetchAllocations = async () => {
      setIsFetching(true)
      try {
        const result = await getBudgetBreakdown({ projectId })
        if (result.success && result.data) {
          const newAllocations = {
            labor: '',
            materials: '',
            equipment: '',
            other: '',
          }
          const newBudgetIds: Record<string, string> = {}
          result.data.forEach((item: any) => {
            const cat = item.category as 'labor' | 'materials' | 'equipment' | 'other'
            newAllocations[cat] = item.allocated.toString()
            newBudgetIds[cat] = item.budget_id
          })
          setAllocations(newAllocations)
          setBudgetIds(newBudgetIds)
        }
      } catch (error) {
        console.error('Failed to fetch budget allocations:', error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchAllocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handleLineItemsUpdate = () => {
    router.refresh()
  }

  const calculateTotal = () => {
    return Object.values(allocations).reduce((sum, value) => {
      const num = parseFloat(value) || 0
      return sum + num
    }, 0)
  }

  const totalAllocated = calculateTotal()
  const remaining = totalBudget - totalAllocated
  const isOverBudget = totalAllocated > totalBudget

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('💾 BudgetAllocationForm: Submit button clicked')

    if (isOverBudget) {
      console.warn('⚠️ BudgetAllocationForm: Over budget validation failed', {
        totalAllocated,
        totalBudget,
      })
      toast({
        title: 'Error',
        description: `Total allocation ($${totalAllocated.toLocaleString()}) exceeds project budget ($${totalBudget.toLocaleString()})`,
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    console.log('💾 BudgetAllocationForm: Loading state set to true')

    try {
      const allocationArray = CATEGORIES
        .filter((cat) => allocations[cat.value] && parseFloat(allocations[cat.value]) > 0)
        .map((cat) => ({
          category: cat.value,
          amount: parseFloat(allocations[cat.value]),
        }))

      console.log('💾 BudgetAllocationForm: Allocations prepared', {
        count: allocationArray.length,
        allocations: allocationArray,
      })

      if (allocationArray.length === 0) {
        console.warn('⚠️ BudgetAllocationForm: No allocations to save')
        toast({
          title: 'Error',
          description: 'Please allocate budget to at least one category',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      console.log('💾 BudgetAllocationForm: Calling updateBudgetAllocation action...')
      const result = await updateBudgetAllocation({
        projectId,
        allocations: allocationArray,
        reason: reason.trim() || undefined,
      })

      console.log('💾 BudgetAllocationForm: Action returned', {
        success: result.success,
        hasError: !result.success && 'error' in result ? !!result.error : false,
      })

      if (result.success) {
        console.log('✅ BudgetAllocationForm: Allocations saved successfully')
        toast({
          title: 'Success',
          description: 'Budget allocations updated successfully',
        })
        setReason('')
        router.refresh()
      } else {
        console.error('❌ BudgetAllocationForm: Save failed', {
          error: result.error,
        })
        toast({
          title: 'Error',
          description: result.error || 'Failed to update budget allocations',
          variant: 'destructive',
          duration: 7000, // Show error longer
        })
      }
    } catch (error) {
      console.error('❌ BudgetAllocationForm: Unexpected error during save', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
        duration: 7000, // Show error longer
      })
    } finally {
      console.log('💾 BudgetAllocationForm: Loading state set to false')
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-neutral-500">Loading budget allocations...</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-900">
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold">Total Project Budget:</span>
            <span className="text-xl font-bold">${totalBudget.toLocaleString()}</span>
          </div>
          <QuoteUploadDialog
            projectId={projectId}
            category={null}
            onUploadSuccess={() => {
              router.refresh()
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((category) => {
          const budgetId = budgetIds[category.value]
          const isExpanded = expandedCategories[category.value]
          const hasAllocation = parseFloat(allocations[category.value]) > 0

          return (
            <div key={category.value} className="border rounded-lg">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCategory(category.value)}
                      disabled={!budgetId}
                      className="h-6 w-6 p-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <Label htmlFor={category.value} className="text-lg font-semibold">
                      {category.label}
                    </Label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                    <Input
                      id={category.value}
                      type="number"
                      step="0.01"
                      min="0"
                      value={allocations[category.value]}
                      onChange={(e) => setAllocations({ ...allocations, [category.value]: e.target.value })}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>

              {budgetId && isExpanded && (
                <div className="border-t p-4 bg-muted/30">
                  <LineItemsTable
                    budgetId={budgetId}
                    category={category.value as BudgetCategory}
                    canEdit={true}
                    onUpdate={handleLineItemsUpdate}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">Total Allocated:</span>
          <span className={`text-xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
            ${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Remaining:</span>
          <span className={`text-xl font-bold ${isOverBudget ? 'text-red-600' : 'text-neutral-900'}`}>
            ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {isOverBudget && (
          <p className="text-sm text-red-600">
            Total allocation exceeds project budget by ${(totalAllocated - totalBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">
          Reason for Change <span className="text-neutral-500 text-sm">(Optional)</span>
        </Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you're updating the budget allocations..."
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-neutral-500">
          {reason.length}/500 characters
        </p>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.refresh()}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isLoading || isOverBudget}>
          {isLoading ? 'Saving...' : 'Save Allocations'}
        </Button>
      </div>
    </form>
  )
}
