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
import { DollarSign } from 'lucide-react'

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
          result.data.forEach((item) => {
            newAllocations[item.category] = item.allocated.toString()
          })
          setAllocations(newAllocations)
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

    if (isOverBudget) {
      toast({
        title: 'Error',
        description: `Total allocation ($${totalAllocated.toLocaleString()}) exceeds project budget ($${totalBudget.toLocaleString()})`,
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const allocationArray = CATEGORIES
        .filter((cat) => allocations[cat.value] && parseFloat(allocations[cat.value]) > 0)
        .map((cat) => ({
          category: cat.value,
          amount: parseFloat(allocations[cat.value]),
        }))

      if (allocationArray.length === 0) {
        toast({
          title: 'Error',
          description: 'Please allocate budget to at least one category',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      const result = await updateBudgetAllocation({
        projectId,
        allocations: allocationArray,
        reason: reason.trim() || undefined,
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Budget allocations updated successfully',
        })
        setReason('')
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update budget allocations',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
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
        <div className="flex items-center gap-2 text-blue-900">
          <DollarSign className="h-4 w-4" />
          <span className="font-semibold">Total Project Budget:</span>
          <span className="text-xl font-bold">${totalBudget.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <div key={category.value} className="space-y-2">
            <Label htmlFor={category.value}>
              {category.label}
            </Label>
            <div className="relative">
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
        ))}
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
