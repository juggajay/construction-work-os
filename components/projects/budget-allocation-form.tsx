'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateBudgetAllocation } from '@/lib/actions/budgets'
import { getBudgetBreakdown } from '@/lib/actions/budgets'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { DollarSign, ChevronDown, ChevronRight, Hammer, Package, Truck, MoreHorizontal } from 'lucide-react'
import { QuoteUploadDialog } from '@/components/budgets/quote-upload-dialog'
import { LineItemsTable } from '@/components/budgets/line-items-table'
import type { Database } from '@/lib/types/supabase'
import { logger } from '@/lib/utils/logger'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

interface BudgetAllocationFormProps {
  projectId: string
  totalBudget: number
}

const CATEGORIES = [
  { value: 'labor', label: 'Labor', icon: Hammer, color: 'blue' },
  { value: 'materials', label: 'Materials', icon: Package, color: 'emerald' },
  { value: 'equipment', label: 'Equipment', icon: Truck, color: 'amber' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'purple' },
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
    logger.debug('Budget allocation form submitted', {
      action: 'BudgetAllocationForm.handleSubmit',
      projectId,
    })

    if (isOverBudget) {
      logger.warn('Budget allocation validation failed - over budget', {
        action: 'BudgetAllocationForm.handleSubmit',
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
    logger.debug('Started budget allocation save', {
      action: 'BudgetAllocationForm.handleSubmit',
    })

    try {
      const allocationArray = CATEGORIES
        .filter((cat) => allocations[cat.value] && parseFloat(allocations[cat.value]) > 0)
        .map((cat) => ({
          category: cat.value,
          amount: parseFloat(allocations[cat.value]),
        }))

      logger.debug('Allocations prepared for save', {
        action: 'BudgetAllocationForm.handleSubmit',
        count: allocationArray.length,
      })

      if (allocationArray.length === 0) {
        logger.warn('No allocations to save', {
          action: 'BudgetAllocationForm.handleSubmit',
        })
        toast({
          title: 'Error',
          description: 'Please allocate budget to at least one category',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      logger.debug('Calling updateBudgetAllocation action', {
        action: 'BudgetAllocationForm.handleSubmit',
      })
      const result = await updateBudgetAllocation({
        projectId,
        allocations: allocationArray,
        reason: reason.trim() || undefined,
      })

      logger.debug('updateBudgetAllocation action returned', {
        action: 'BudgetAllocationForm.handleSubmit',
        success: result.success,
      })

      if (result.success) {
        logger.info('Budget allocations saved successfully', {
          action: 'BudgetAllocationForm.handleSubmit',
          projectId,
          allocationCount: allocationArray.length,
        })
        toast({
          title: 'Success',
          description: 'Budget allocations updated successfully',
        })
        setReason('')
        router.refresh()
      } else {
        logger.error('Budget allocation save failed', new Error(result.error || 'Unknown error'), {
          action: 'BudgetAllocationForm.handleSubmit',
          error: result.error,
        })
        toast({
          title: 'Error',
          description: result.error || 'Failed to update budget allocations',
          variant: 'destructive',
          duration: 7000,
        })
      }
    } catch (error) {
      logger.error('Unexpected error during budget allocation save', error as Error, {
        action: 'BudgetAllocationForm.handleSubmit',
      })
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
        duration: 7000,
      })
    } finally {
      logger.debug('Budget allocation save process finished', {
        action: 'BudgetAllocationForm.handleSubmit',
      })
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white/40">Loading budget allocations...</div>
      </div>
    )
  }

  const inputStyles = cn(
    "w-full px-4 py-3 rounded-lg text-sm transition-all",
    "bg-white/[0.03] border border-white/[0.08]",
    "text-white placeholder:text-white/30",
    "focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Total Budget Display */}
      <div className={cn(
        "rounded-lg p-4",
        "bg-emerald-500/10 border border-emerald-500/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <DollarSign className="h-5 w-5" />
            <span className="font-medium">Total Project Budget:</span>
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

      {/* Category Allocations */}
      <div className="space-y-3">
        {CATEGORIES.map((category) => {
          const budgetId = budgetIds[category.value]
          const isExpanded = expandedCategories[category.value]
          const Icon = category.icon

          return (
            <div
              key={category.value}
              className={cn(
                "rounded-lg overflow-hidden",
                "bg-white/[0.02] border border-white/[0.06]"
              )}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.value)}
                      disabled={!budgetId}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        budgetId ? "hover:bg-white/[0.05]" : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-white/40" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-white/40" />
                      )}
                    </button>
                    <div className={cn(
                      "p-2 rounded-lg",
                      category.color === 'blue' && "bg-blue-500/10",
                      category.color === 'emerald' && "bg-emerald-500/10",
                      category.color === 'amber' && "bg-amber-500/10",
                      category.color === 'purple' && "bg-purple-500/10",
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        category.color === 'blue' && "text-blue-400",
                        category.color === 'emerald' && "text-emerald-400",
                        category.color === 'amber' && "text-amber-400",
                        category.color === 'purple' && "text-purple-400",
                      )} />
                    </div>
                    <label htmlFor={category.value} className="text-base font-medium text-white">
                      {category.label}
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-10">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <input
                      id={category.value}
                      type="number"
                      step="0.01"
                      min="0"
                      value={allocations[category.value]}
                      onChange={(e) => setAllocations({ ...allocations, [category.value]: e.target.value })}
                      placeholder="0.00"
                      className={cn(inputStyles, "pl-8")}
                    />
                  </div>
                </div>
              </div>

              {budgetId && isExpanded && (
                <div className="border-t border-white/[0.06] p-4 bg-white/[0.01]">
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

      {/* Budget Summary */}
      <div className={cn(
        "rounded-lg p-4 space-y-3",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-white/70">Total Allocated:</span>
          <span className={cn(
            "text-xl font-bold",
            isOverBudget ? "text-red-400" : "text-emerald-400"
          )}>
            ${totalAllocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-white/70">Remaining:</span>
          <span className={cn(
            "text-xl font-bold",
            isOverBudget ? "text-red-400" : "text-white"
          )}>
            ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {isOverBudget && (
          <p className="text-sm text-red-400">
            Total allocation exceeds project budget by ${(totalAllocated - totalBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        )}

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isOverBudget ? "bg-red-500" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min((totalAllocated / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-white/40">
            <span>0%</span>
            <span>{((totalAllocated / totalBudget) * 100).toFixed(0)}% allocated</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Reason for Change */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-white/70 mb-2">
          Reason for Change <span className="text-white/40">(Optional)</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you're updating the budget allocations..."
          maxLength={500}
          rows={3}
          className={cn(
            "w-full px-4 py-3 rounded-lg text-sm transition-all resize-none",
            "bg-white/[0.03] border border-white/[0.08]",
            "text-white placeholder:text-white/30",
            "focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
          )}
        />
        <p className="text-xs text-white/40 mt-1">
          {reason.length}/500 characters
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => router.refresh()}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            "bg-white/[0.03] border border-white/[0.08] text-white/60",
            "hover:bg-white/[0.06] hover:text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={isLoading || isOverBudget}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            "bg-amber-500/10 border border-amber-500/20 text-amber-400",
            "hover:bg-amber-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? 'Saving...' : 'Save Allocations'}
        </button>
      </div>
    </form>
  )
}
